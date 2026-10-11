/**
 * Boot the app's own database client from plain Node.
 *
 * The client is TypeScript and imports through the `@/` alias, neither of
 * which bare Node resolves. `--experimental-strip-types` handles the first
 * (Node 22.6+, types are annotations only — no enums, no namespaces), and the
 * resolve hook below handles the second by pointing `@/x` at `src/x.ts`.
 *
 * Doing it this way rather than re-implementing the migrations means the
 * database these scripts inspect is byte-for-byte the one the server reads.
 *
 * Invoked as: node --experimental-strip-types --no-warnings _boot-client.mjs
 */

import { registerHooks } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const SRC = path.resolve(process.cwd(), "src");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(
        pathToFileURL(path.join(SRC, `${specifier.slice(2)}.ts`)).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const { getDb } = await import(pathToFileURL(path.join(SRC, "db/client.ts")).href);
const db = getDb();
const count = (table) => db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;

const report = {
  products: count("products"),
  categories: count("categories"),
  brands: count("brands"),
  shelfFilters: count("shelf_filters"),
  images: count("product_images"),
  specs: count("product_specs"),
  highlights: count("product_highlights"),
  shelves: count("product_shelves"),
  fts: count("products_fts"),
};

db.close();
console.log(JSON.stringify(report));
