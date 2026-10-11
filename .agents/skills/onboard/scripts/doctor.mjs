#!/usr/bin/env node
/**
 * Onboard doctor — is this working tree ready to develop on?
 *
 *   node .agents/skills/onboard/scripts/doctor.mjs          # offline checks
 *   node .agents/skills/onboard/scripts/doctor.mjs --live   # also probe the API
 *
 * Read-only by design. It never deletes `data/farmart.db` or runs
 * `npm run db:reset` — the point is to find out *what state* the checkout is
 * in so the caller can decide what to do about it. A reset is only safe when
 * the database still matches the seed file; this script reports which case
 * you're in rather than assuming.
 *
 * Exit codes: 0 = ready to develop, 1 = a blocker needs fixing,
 * 2 = ready but with something worth knowing (warning only).
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DB_PATH =
  process.env.FARMART_DB_PATH ?? path.join(ROOT, "data", "farmart.db");
const SEED_FILE = path.join(ROOT, "src", "db", "seed-data.ts");
const LIVE = process.argv.includes("--live");
const BASE_URL = process.env.ONBOARD_BASE_URL ?? "http://localhost:3000";

const results = [];
let worst = 0;

const bump = (level) => {
  worst = Math.max(worst, level);
};
const ok = (label, detail) => results.push({ level: "ok", label, detail });
const warn = (label, detail) => {
  results.push({ level: "warn", label, detail });
  bump(2);
};
const fail = (label, detail, hint) => {
  results.push({ level: "fail", label, detail, hint });
  bump(1);
};
const skip = (label, detail) => results.push({ level: "skip", label, detail });

// --------------------------------------------------------------- toolchain
const MIN_NODE = 20;
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= MIN_NODE) {
  ok("Node version", `v${process.versions.node}`);
} else {
  fail(
    "Node version",
    `v${process.versions.node} is older than v${MIN_NODE}`,
    "Next 16 and better-sqlite3 both want Node 20+. Use nvm to switch.",
  );
}

if (existsSync(path.join(ROOT, "package.json"))) {
  ok("package.json", "found");
} else {
  fail("package.json", "missing — wrong directory?", `Run from ${ROOT}.`);
}

for (const dep of ["next", "react", "better-sqlite3", "typescript"]) {
  const dir = path.join(ROOT, "node_modules", dep);
  if (!existsSync(dir)) {
    fail(`node_modules/${dep}`, "not installed", "Run `npm install`.");
  }
}

// A fresh clone installs the better-sqlite3 native binding for whatever Node
// was on PATH at install time. Switching Node versions (or a plain `npm ci`
// after an upgrade) leaves a binding that throws on require, which reads as
// "the app is broken" rather than "rebuild me".
let Database = null;
if (existsSync(path.join(ROOT, "node_modules", "better-sqlite3"))) {
  try {
    const mod = await import("better-sqlite3");
    Database = mod.default ?? mod;
    ok("better-sqlite3 native binding", "loads");
  } catch (err) {
    fail(
      "better-sqlite3 native binding",
      String(err.message).split("\n")[0],
      "The prebuilt binary does not match this Node version. Run:\n" +
        "    npm rebuild better-sqlite3",
    );
  }
}

// ------------------------------------------------------- seed file vs reality
let expected = null;
if (existsSync(SEED_FILE)) {
  const src = readFileSync(SEED_FILE, "utf8");
  const slice = (start, end) => {
    const from = src.indexOf(start);
    if (from === -1) return "";
    const to = end ? src.indexOf(end, from) : src.length;
    return src.slice(from, to === -1 ? src.length : to);
  };
  expected = {
    products: (slice("export const seedProducts").match(/^ {4}sku:/gm) ?? []).length,
    categories: (
      slice("export const seedCategories", "export const seedBrands").match(/\{ slug:/g) ?? []
    ).length,
    brands: (
      slice("export const seedBrands", "export const seedShelfFilters").match(/\{ id:/g) ?? []
    ).length,
  };
  ok(
    "seed-data.ts",
    `declares ${expected.products} products, ${expected.categories} categories, ${expected.brands} brands`,
  );
} else {
  fail("src/db/seed-data.ts", "missing", "The database is rebuilt from this file.");
}

// -------------------------------------------------------------- database
let db = null;
if (!existsSync(DB_PATH)) {
  skip(
    "database file",
    `${DB_PATH} does not exist yet — normal on a fresh clone`,
  );
  ok(
    "seed trigger",
    "the database is created lazily on the first request that reads it, " +
      "so there is nothing to do until you start the server",
  );
} else {
  const bytes = statSync(DB_PATH).size;
  if (!Database) {
    skip("database contents", "better-sqlite3 unavailable, cannot open it");
  } else {
    try {
      db = new Database(DB_PATH, { readonly: true });
      const count = (table) => {
        try {
          return db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
        } catch {
          return null;
        }
      };
      const products = count("products");
      const categories = count("categories");
      const brands = count("brands");
      const fts = count("products_fts");

      ok(
        "database file",
        `${(bytes / 1024).toFixed(0)} KB — ${products} products, ${categories} categories, ${brands} brands`,
      );

      if (products === 0) {
        warn(
          "database is empty",
          "the file exists but no rows are in it",
          "seedIfEmpty() would refill it on the next read; if it does not, " +
            "check for a failed migration in the server log.",
        );
      } else if (
        expected &&
        products === expected.products &&
        categories === expected.categories &&
        brands === expected.brands
      ) {
        ok(
          "database matches seed-data.ts",
          "safe to reset — nothing here that the seed file cannot recreate",
        );
      } else {
        warn(
          "database has diverged from seed-data.ts",
          `db has ${products}/${categories}/${brands}, seed declares ` +
            `${expected.products}/${expected.categories}/${expected.brands}`,
          "Rows were added or edited outside the seed file. This is the one " +
            "case where `npm run db:reset` would destroy work. Confirm with " +
            "the user before running it, or hand-edit the data instead.",
        );
      }

      const integrity = db.pragma("foreign_key_check");
      if (integrity.length === 0) {
        ok("foreign keys", "no violations");
      } else {
        fail(
          "foreign keys",
          `${integrity.length} violation(s): ${JSON.stringify(integrity.slice(0, 3))}`,
          "Something wrote a row without a matching brand or category.",
        );
      }

      // The FTS table inlines the brand name, so it can drift out of sync with
      // the products table. A stale index is the usual reason a product that
      // clearly exists returns nothing from /api/products?q=...
      const ftsProductIds = new Set(
        db.prepare("SELECT id FROM products_fts").all().map((r) => r.id),
      );
      const productIds = db.prepare("SELECT id FROM products").all().map((r) => r.id);
      const missing = productIds.filter((id) => !ftsProductIds.has(id));
      if (fts === null) {
        skip("search index", "no products_fts table");
      } else if (missing.length === 0 && ftsProductIds.size === productIds.length) {
        ok("search index", `${ftsProductIds.size} rows, in sync with products`);
      } else {
        warn(
          "search index is stale",
          `${missing.length} product(s) missing from products_fts`,
          "Call syncSearchIndex(db) after any write, or reseed.",
        );
      }
    } catch (err) {
      fail("open database", String(err.message).split("\n")[0]);
    } finally {
      db?.close();
    }
  }
}

// ------------------------------------------------------------ live checks
if (LIVE) {
  const probes = [
    ["/api/categories", "categories list"],
    ["/api/products?limit=1", "product list"],
    ["/api/shelves/top-savers", "top savers shelf"],
  ];
  let reachable = false;
  for (const [route] of probes) {
    const started = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${route}`, {
        signal: AbortSignal.timeout(8000),
      });
      reachable = true;
      const body = await res.json().catch(() => null);
      const total = body?.meta?.total ?? body?.items?.length;
      if (res.ok) {
        ok(
          `GET ${route}`,
          `200 in ${Date.now() - started}ms${total != null ? ` — ${total} item(s)` : ""}`,
        );
      } else {
        fail(`GET ${route}`, `HTTP ${res.status}`);
      }
    } catch (err) {
      if (!reachable) {
        skip(
          `GET ${route}`,
          `${BASE_URL} not answering (${err.message}) — is the dev server running?`,
        );
      } else {
        fail(`GET ${route}`, err.message);
      }
      break;
    }
  }
  if (!reachable) {
    results.push({
      level: "hint",
      label: "to start the server",
      detail: "npm run dev   (then re-run with --live)",
    });
  }
}

// ----------------------------------------------------------------- output
const glyph = { ok: "✓", warn: "⚠", fail: "✗", skip: "·", hint: "→" };
const width = Math.max(...results.map((r) => r.label.length));
for (const r of results) {
  console.log(`${glyph[r.level]} ${r.label.padEnd(width)}  ${r.detail ?? ""}`);
  if (r.hint) {
    console.log(`  ${" ".repeat(width)}  ${r.hint.replace(/\n/g, "\n  ")}`);
  }
}

console.log("");
if (worst === 0) console.log("Ready to develop.");
else if (worst === 2) console.log("Usable, but read the warnings before you rely on it.");
else console.log("Not ready. Fix the ✗ items above first.");

process.exit(worst === 2 ? 2 : worst);
