/**
 * The `sort` values the catalogue accepts, in one place.
 *
 * This lives outside `@/db/queries` because a `"use client"` component needs to
 * validate the URL param too, and importing the query layer would pull
 * `better-sqlite3` into the client bundle. The ORDER BY clauses themselves stay
 * server-side, in `src/db/queries.ts`.
 */

export const SORT_KEYS = [
  "price_asc",
  "price_desc",
  "rating",
  "best_selling",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "best_selling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

/** Narrows an untrusted `sort` param, falling back to the default ordering. */
export function toSortKey(value: string | undefined | null): SortKey | undefined {
  return SORT_KEYS.find((key) => key === value);
}

export const DEFAULT_SORT: SortKey = "best_selling";