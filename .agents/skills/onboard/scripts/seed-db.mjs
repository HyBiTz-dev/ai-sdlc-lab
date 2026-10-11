#!/usr/bin/env node
/**
 * Rebuild `data/farmart.db` from `src/db/seed-data.ts`, without losing work.
 *
 *   node .agents/skills/onboard/scripts/seed-db.mjs          # refuses on divergence
 *   node .agents/skills/onboard/scripts/seed-db.mjs --force  # back up, then reset
 *
 * `npm run db:reset` is a blind `rm`, and `data/` is gitignored, so a reset on
 * a database that holds rows the seed file cannot recreate is unrecoverable.
 * This script compares the database against the seed file first and stops with
 * an explanation when they disagree, unless you pass --force (which renames the
 * old file to a timestamped `.bak` first).
 *
 * Seeding happens through the app's own `src/db/client.ts`, so the rows you get
 * are the rows the server reads — no parallel implementation to drift.
 */

import { existsSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DB_PATH = process.env.FARMART_DB_PATH ?? path.join(ROOT, "data", "farmart.db");
const SEED_FILE = path.join(ROOT, "src", "db", "seed-data.ts");
const SELF = path.relative(ROOT, process.argv[1]);
const FORCE = process.argv.includes("--force");
const BOOT = path.join(ROOT, ".agents", "skills", "onboard", "scripts", "_boot-client.mjs");

const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

// ----------------------------------------------------------- what the file says
if (!existsSync(SEED_FILE)) die(`✗ ${SEED_FILE} not found — run this from the project root.`);

const src = readFileSync(SEED_FILE, "utf8");
const productsInSeed = (src.slice(src.indexOf("export const seedProducts")).match(/^ {4}sku:/gm) ?? []).length;
if (productsInSeed === 0) {
  die("✗ Could not count products in seed-data.ts — the file's shape may have changed.");
}

// ----------------------------------------------------------- read the current db
function inspect() {
  if (!existsSync(DB_PATH)) return null;
  if (!existsSync(BOOT)) return null;
  const res = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", BOOT],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (res.status !== 0) return null;
  try {
    return JSON.parse(res.stdout.trim().split("\n").pop());
  } catch {
    return null;
  }
}

const current = inspect();

if (current) {
  if (current.products === 0) {
    console.log("· Database exists but holds no products — seeding, nothing to lose.");
  } else if (current.products === productsInSeed && current.fts === current.products) {
    console.log(
      `✓ Database already matches seed-data.ts (${current.products} products, search index in sync).\n` +
        `  Nothing to do. Pass --force if you want a clean rebuild anyway.`,
    );
    process.exit(0);
  } else if (current.products === productsInSeed) {
    console.log(`· Database has the right rows but a stale search index — rebuilding.`);
    renameSync(DB_PATH, `${DB_PATH}.${Date.now()}.bak`);
  } else if (!FORCE) {
    die(
      `\n✗ Refusing to delete data that the seed file cannot recreate.\n\n` +
        `    database : ${current.products} products, ${current.categories} categories, ${current.brands} brands\n` +
        `    seed file: ${productsInSeed} products\n\n` +
        `  Those rows were edited or added directly in SQLite. git cannot recover\n` +
        `  them — data/ is gitignored — so this script will not delete them\n` +
        `  without being told.\n\n` +
        `  Keep the data   : nothing to do, the database is usable as-is.\n` +
        `  Keep a copy     : mv data/farmart.db data/farmart.db.bak\n` +
        `  Replace anyway  : node ${SELF} --force\n`,
    );
  } else {
    const backup = `${DB_PATH}.${new Date().toISOString().replace(/[:.]/g, "-")}.bak`;
    renameSync(DB_PATH, backup);
    console.log(`⚠ --force: old database moved to ${path.relative(ROOT, backup)}`);
  }
} else if (existsSync(DB_PATH)) {
  console.log("· Could not read the existing database (Node 22.6+ with --experimental-strip-types is needed).");
  if (!FORCE) {
    die(
      `  Refusing to delete it blind. Inspect it yourself, then re-run with --force if it is disposable:\n` +
        `      node ${SELF} --force`,
    );
  }
  renameSync(DB_PATH, `${DB_PATH}.bak`);
  console.log(`  Moved to ${path.relative(ROOT, DB_PATH)}.bak`);
}

// ----------------------------------------------------------- build it
const res = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--no-warnings", BOOT],
  { cwd: ROOT, encoding: "utf8", env: process.env },
);

if (res.status !== 0) {
  die(
    `✗ Seeding failed.\n${res.stderr.trim().split("\n").slice(-6).join("\n")}\n\n` +
      `  If this is a native-binding error (better-sqlite3 was built for another\n` +
      `  Node version), run:  npm rebuild better-sqlite3`,
  );
}

const now = JSON.parse(res.stdout.trim().split("\n").pop());
console.log(
  `✓ ${now.products} products, ${now.categories} categories, ${now.brands} brands, ` +
    `${now.fts} search rows, ${now.images} gallery images.`,
);

if (now.products !== productsInSeed) {
  die(`✗ Seeded ${now.products} products but seed-data.ts declares ${productsInSeed}. That is a bug in the seed — investigate before developing on it.`);
}
if (now.fts !== now.products) {
  console.warn(`⚠ Search index has ${now.fts} rows for ${now.products} products — search will miss some products.`);
}
