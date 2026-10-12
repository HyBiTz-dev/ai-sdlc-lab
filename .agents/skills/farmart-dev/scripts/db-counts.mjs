/**
 * Row counts from a throwaway in-memory database.
 *
 * The database is a build artefact of `src/db/seed-data.ts`, so the only
 * trustworthy counts are the ones a real boot produces. This opens an
 * in-memory copy using the app's own `src/db/client.ts` — same migrations,
 * same seed, same FTS index — and reads the counts back. It never touches
 * `data/farmart.db`.
 *
 * Must run under `node --experimental-strip-types`: the client is TypeScript
 * and imports through the `@/` alias, neither of which bare Node resolves.
 * The resolve hook is the same one onboard's `_boot-client.mjs` installs.
 */

import fs from "node:fs"
import { registerHooks } from "node:module"
import path from "node:path"
import process from "node:process"
import { pathToFileURL } from "node:url"

const TABLES = [
  "products",
  "categories",
  "brands",
  "product_specs",
  "product_highlights",
  "product_images",
  "product_shelves",
  "shelf_filters",
  "products_fts",
]

/** `registerHooks` is process-global; one install is enough. */
let hooksInstalled = false

/**
 * Reads the counts.
 *
 * Resolves to `{ source: "unavailable", reason }` when the client cannot be
 * booted, so the caller can fall back to static counts from `seed-data.ts`
 * rather than failing the whole sync.
 */
export async function readRowCounts(root = process.cwd()) {
  const src = path.join(root, "src")
  if (!fs.existsSync(src)) {
    return { source: "unavailable", reason: "src/ not found", counts: null }
  }

  if (!hooksInstalled) {
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.startsWith("@/")) {
          return nextResolve(
            pathToFileURL(path.join(src, `${specifier.slice(2)}.ts`)).href,
            context,
          )
        }
        return nextResolve(specifier, context)
      },
    })
    hooksInstalled = true
  }

  const previous = process.env.FARMART_DB_PATH
  process.env.FARMART_DB_PATH = ":memory:"

  let db
  try {
    const { getDb } = await import(pathToFileURL(path.join(src, "db/client.ts")).href)
    db = getDb()

    const counts = Object.fromEntries(
      TABLES.map((table) => [table, db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c]),
    )

    // Shelf membership is the quietest way a product goes missing: it sits on
    // no shelf, so no homepage section renders it and nothing errors anywhere.
    counts.byShelf = Object.fromEntries(
      db
        .prepare(
          `SELECT shelf, COUNT(*) AS c FROM product_shelves GROUP BY shelf ORDER BY shelf`,
        )
        .all()
        .map((row) => [row.shelf, row.c]),
    )

    return { source: "live", counts }
  } catch (error) {
    return {
      source: "unavailable",
      reason: String(error?.message ?? error),
      counts: null,
    }
  } finally {
    // `getDb()` memoises the handle on `globalThis.__farmartDb`, and the module
    // stays in the ESM cache for the life of the process. Closing the handle
    // without clearing the memo would leave the *closed* handle cached, so the
    // second call in a long-running loop would fail with "the database
    // connection is not open" — and every tick after that. Delete the memo so
    // the next call re-boots a fresh in-memory database.
    if (db) db.close()
    delete globalThis.__farmartDb
    if (previous === undefined) delete process.env.FARMART_DB_PATH
    else process.env.FARMART_DB_PATH = previous
  }
}