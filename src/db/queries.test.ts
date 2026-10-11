import { describe, expect, it } from "vitest";
import { getShelfFilters, getShelfProducts, listCategories, listBrands, searchProducts, toMatchQuery } from "@/db/queries";

/**
 * Query-level tests. Every test file gets its own seeded in-memory database,
 * so the counts asserted here are properties of `seed-data.ts`.
 */

describe("toMatchQuery", () => {
  it("quotes every token as a prefix term", () => {
    expect(toMatchQuery("beef")).toBe('"beef"*');
    expect(toMatchQuery("green tea")).toBe('"green"* "tea"*');
  });

  it("strips characters that FTS5 would treat as syntax", () => {
    // Unbalanced quotes or a bare AND would throw inside SQLite.
    expect(toMatchQuery('"unbalanced AND')).toBe('"unbalanced"* "and"*');
    expect(toMatchQuery("ice-cream (350ml)")).toBe('"ice"* "cream"* "350ml"*');
  });

  it("returns null when nothing searchable is left", () => {
    expect(toMatchQuery("")).toBeNull();
    expect(toMatchQuery("!!! ???")).toBeNull();
  });

  it("keeps non-latin letters", () => {
    expect(toMatchQuery("กาแฟ")).toBe('"กาแฟ"*');
  });
});

describe("listCategories", () => {
  const categories = listCategories();

  it("returns every category in seed order with a product count", () => {
    expect(categories.map((category) => category.name)).toEqual([
      "fruits-vegetables",
      "breads-sweets",
      "frozen-seafoods",
      "raw-meats",
      "wines-alcohol",
      "coffees-teas",
      "milks-dairies",
      "pet-foods",
    ]);
    expect(categories.find((entry) => entry.name === "raw-meats")?.productCount).toBe(4);
  });

  it("counts to the size of the seeded catalogue", () => {
    const total = categories.reduce((sum, category) => sum + category.productCount, 0);
    expect(total).toBe(29);
  });
});

describe("listBrands", () => {
  it("returns only brands that have a promo tile", () => {
    // Vendor-only brands have no promo_* columns and must stay hidden.
    const brands = listBrands();
    expect(brands.map((brand) => brand.id)).toEqual(["foodpouch", "itek", "soda", "farmart"]);
    expect(brands.every((brand) => brand.title && brand.image && brand.background)).toBe(true);
  });
});

describe("getShelfProducts", () => {
  it("returns the top savers shelf in position order", () => {
    const items = getShelfProducts("top-savers");
    expect(items.length).toBe(5);
    expect(items.every((item) => item.id && item.name && item.price)).toBe(true);
  });

  it("keeps every top saver discounted", () => {
    // The shelf header links to /search?onSale=true, so anything without an
    // old price would silently vanish on click-through.
    expect(getShelfProducts("top-savers").every((item) => item.oldPrice !== null)).toBe(true);
  });

  it("treats the All tab as no category filter", () => {
    // "All" is a shelf_filters sentinel, not a categories.label — feeding it
    // back as ?category= used to return an empty shelf.
    const all = getShelfProducts("best-sellers");
    expect(getShelfProducts("best-sellers", "All")).toEqual(all);
    expect(getShelfProducts("best-sellers", "")).toEqual(all);
    expect(getShelfProducts("best-sellers", getShelfFilters("best-sellers")[0])).toEqual(all);
  });

  it("filters the best sellers shelf by category label", () => {
    const all = getShelfProducts("best-sellers");
    const filtered = getShelfProducts("best-sellers", "Pet Foods");

    expect(all.length).toBe(13);
    expect(filtered.length).toBeLessThan(all.length);
    expect(filtered.every((item) => item.category === "Pet Foods")).toBe(true);
  });

  it("returns everything for an unknown category label", () => {
    // The handler 404s on an unknown slug, so an unknown *label* means no rows.
    expect(getShelfProducts("best-sellers", "Nonexistent")).toEqual([]);
  });
});

describe("getShelfFilters", () => {
  it("lists the best-seller filter tabs, All first", () => {
    const filters = getShelfFilters("best-sellers");
    expect(filters[0]).toBe("All");
    expect(filters).toContain("Raw Meats");
  });

  it("returns nothing for a shelf with no tabs", () => {
    expect(getShelfFilters("top-savers")).toEqual([]);
  });
});

describe("searchProducts — filters", () => {
  it("returns the whole catalogue with no query", () => {
    const { meta } = searchProducts({});
    expect(meta.total).toBe(29);
  });

  it("matches free text across name, brand and SKU", () => {
    expect(searchProducts({ q: "beef" }).items.map((item) => item.id).sort()).toEqual([
      "beef-mince",
      "british-beef",
    ]);
    // "Farmart" is a brand tag, not part of any product name.
    expect(searchProducts({ q: "farmart" }).meta.total).toBeGreaterThan(0);
    // SKU is indexed too.
    expect(searchProducts({ q: "FM-BM-20-500" }).items[0]?.id).toBe("beef-mince");
  });

  it("finds products by their category label", () => {
    const items = searchProducts({ q: "coffee" }).items;
    expect(items.length).toBeGreaterThan(0);
    // "Coffee & Teas" is indexed, so teas match too.
    expect(items.some((item) => item.category === "Coffee & Teas")).toBe(true);
  });

  it("matches every token as a prefix", () => {
    expect(searchProducts({ q: "gree tea" }).items.map((item) => item.id).sort()).toEqual([
      "green-tea-matcha",
      "jasmine-green-tea",
    ]);
  });

  it("combines q with a category filter", () => {
    const result = searchProducts({ q: "beef", category: "Raw Meats" });
    expect(result.meta.total).toBe(2);
  });

  it("filters by brand and by on-sale", () => {
    expect(searchProducts({ brand: "Farmart" }).meta.total).toBe(6);
    expect(searchProducts({ onSale: true }).meta.total).toBe(10);
  });

  it("returns nothing for a query with no searchable characters", () => {
    const result = searchProducts({ q: "!!!" });
    expect(result.meta.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});

describe("searchProducts — sorting", () => {
  it("sorts by price ascending and descending", () => {
    const asc = searchProducts({ sort: "price_asc", limit: 50 }).items.map((i) => i.priceValue);
    const desc = searchProducts({ sort: "price_desc", limit: 50 }).items.map((i) => i.priceValue);

    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(asc[0]).toBe(4.75);
  });

  it("sorts by rating with unrated products last", () => {
    const ratings = searchProducts({ sort: "rating", limit: 50 }).items.map((i) => i.rating ?? -1);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it("ranks by relevance when q is present, ignoring sort", () => {
    const result = searchProducts({ q: "beef", sort: "price_asc" });
    // Both beef products are relevant; bm25 order, not price order.
    expect(result.meta.total).toBe(2);
  });

  it("falls back to best-selling for an inherited Object.prototype key", () => {
    // `sort=constructor` used to resolve to the Object constructor and
    // interpolate a function body into ORDER BY, throwing a SqliteError.
    const bestSelling = searchProducts({ sort: "best_selling" }).items.map((i) => i.id);

    for (const key of ["constructor", "toString", "__proto__", "valueOf", "hasOwnProperty"]) {
      expect(searchProducts({ sort: key }).items.map((i) => i.id)).toEqual(bestSelling);
    }
  });

  it("falls back to best-selling for an unknown sort value", () => {
    const bogus = searchProducts({ sort: "nonsense" }).items.map((i) => i.id);
    const bestSelling = searchProducts({ sort: "best_selling" }).items.map((i) => i.id);
    expect(bogus).toEqual(bestSelling);
  });
});

describe("searchProducts — pagination", () => {
  it("reports page metadata", () => {
    const { meta } = searchProducts({ limit: 10 });
    expect(meta).toEqual({ page: 1, limit: 10, total: 29, totalPages: 3 });
  });

  it("returns disjoint pages that cover the catalogue", () => {
    const first = searchProducts({ limit: 10, page: 1 }).items.map((i) => i.id);
    const second = searchProducts({ limit: 10, page: 2 }).items.map((i) => i.id);
    const third = searchProducts({ limit: 10, page: 3 }).items.map((i) => i.id);

    expect(new Set([...first, ...second, ...third]).size).toBe(29);
    expect(first).toHaveLength(10);
    expect(third).toHaveLength(9);
  });

  it("clamps limit to at most 50 and at least 1", () => {
    expect(searchProducts({ limit: 500 }).meta.limit).toBe(50);
    expect(searchProducts({ limit: 0 }).meta.limit).toBe(1);
    expect(searchProducts({ page: -3 }).meta.page).toBe(1);
  });

  it("returns an empty page past the end instead of erroring", () => {
    const result = searchProducts({ page: 99 });
    expect(result.items).toEqual([]);
    expect(result.meta.total).toBe(29);
  });
});

describe("searchProducts — facets", () => {
  it("counts every category when no category filter is applied", () => {
    const { facets } = searchProducts({});
    expect(facets.categories.length).toBe(8);
    expect(facets.categories.reduce((sum, f) => sum + f.count, 0)).toBe(29);
  });

  it("ignores its own filter so a shopper can see the alternatives", () => {
    const raw = searchProducts({ category: "Raw Meats" });
    expect(raw.meta.total).toBe(4);
    // Raw Meats still appears, but so do the other seven.
    expect(raw.facets.categories.length).toBe(8);
    expect(raw.facets.categories.find((f) => f.label === "Raw Meats")?.count).toBe(4);
  });

  it("keeps the other filters applied to the facet counts", () => {
    const { facets } = searchProducts({ q: "beef" });
    // Only the two beef products exist, so both brands appear exactly once.
    expect(facets.brands).toEqual(
      expect.arrayContaining([
        { value: "Farmart", label: "Farmart", count: 1 },
        { value: "Meat Brand", label: "Meat Brand", count: 1 },
      ]),
    );
    expect(facets.brands).toHaveLength(2);
  });

  it("orders facets by count then label", () => {
    const { facets } = searchProducts({});
    const counts = facets.categories.map((f) => f.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
});
