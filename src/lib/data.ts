import { cache } from "react";
import {
  getProduct,
  getRelatedProducts,
  getShelfFilters,
  getShelfProducts,
  listBrands,
  listCategories,
  searchProducts,
} from "@/db/queries";
import type { ProductQuery } from "@/db/queries";

/**
 * Data-access layer for Server Components.
 *
 * Pages call these instead of `fetch`ing the app's own API: the query already
 * runs in this process, so an HTTP round-trip would only add latency and a
 * JSON parse. `React.cache` dedupes calls within a request, so several
 * components asking for the same shelf share one query.
 *
 * The API route handlers keep reading `@/db/queries` directly — they *are* the
 * public contract published at `/api/openapi`, so they should not depend on
 * React. That also keeps `/docs` and a future mobile client working.
 *
 * Sync SQLite reads count as predictable values, so prerenderable reads land in
 * the static shell. A read that must be per-request needs `await connection()`
 * as its first line.
 */

/** Homepage shelves. */
export const getTopSavers = cache(async () => getShelfProducts("top-savers"));

export const getBestSellers = cache(async (category?: string) => {
  const [items, filters] = [
    getShelfProducts("best-sellers", category),
    getShelfFilters("best-sellers"),
  ];
  return { items, filters };
});

export const getCategories = cache(async () => listCategories());
export const getBrands = cache(async () => listBrands());

/** Search page: same query the `GET /api/products` handler runs. */
export const searchCatalogue = cache(async (query: ProductQuery) => searchProducts(query));

/** Detail page. Returns `undefined` for an unknown id — callers call `notFound()`. */
export const getProductDetail = cache(async (id: string) => getProduct(id));

export const getRelated = cache(async (id: string, limit = 6) =>
  getRelatedProducts(id, limit),
);
