"use server";

import { searchProducts } from "@/db/queries";
import type { ProductSummaryDto } from "@/lib/api-types";

/**
 * Typeahead suggestions for the header search box.
 *
 * The box is a client component, but the catalogue is a synchronous SQLite read
 * in this process — a server action keeps `better-sqlite3` on the server
 * instead of routing the query through an HTTP round-trip to our own `/api`.
 */

/** Enough rows to show the shopper the term is finding something. */
const SUGGEST_LIMIT = 3;

/** Below this, FTS5 prefix matching returns most of the catalogue. */
const MIN_TERM = 2;

export type SuggestionsDto = {
  items: ProductSummaryDto[];
  /** Total matches, so the footer can say "see all 12" rather than "see all 3". */
  total: number;
};

/**
 * Runs the same FTS5 query as `GET /api/products` (so a suggestion and the
 * results page can never disagree), capped at {@link SUGGEST_LIMIT} rows.
 * `category` is the label currently chosen in the box, so suggestions narrow
 * along with it.
 */
export async function suggestProducts(
  term: string,
  category?: string,
): Promise<SuggestionsDto> {
  const q = term.trim();
  if (q.length < MIN_TERM) return { items: [], total: 0 };

  const result = searchProducts({ q, category, limit: SUGGEST_LIMIT });
  // `facets` are computed but unused here — the dropdown has nowhere to show a
  // facet count, and the catalogue is small enough that the extra queries cost
  // less than a second code path through the query layer.
  return { items: result.items, total: result.meta.total };
}
