import { describe, expect, it } from "vitest";
import { getDb } from "@/db/client";
import { seed, seedIfEmpty, syncSearchIndex, truncateAll } from "@/db/seed";
import { seedProducts } from "@/db/seed-data";
import { getProduct, searchProducts } from "@/db/queries";

/**
 * These tests mutate the shared in-memory database, so they clean up after
 * themselves. Each test file still gets its own copy, but within this file the
 * rows would leak between tests otherwise.
 */

function restore() {
  truncateAll(getDb());
  seed(getDb());
}

describe("seedIfEmpty", () => {
  it("reports that it did nothing when the catalogue is already there", () => {
    restore();
    expect(seedIfEmpty(getDb())).toBe(false);
  });

  it("seeds an empty database", () => {
    truncateAll(getDb());
    expect(seedIfEmpty(getDb())).toBe(true);
    expect(searchProducts({}).meta.total).toBe(29);
  });
});

describe("seed", () => {
  it("restores the catalogue after a destructive test", () => {
    // Proves the helper used by this file works.
    const db = getDb();
    db.prepare("DELETE FROM products").run();
    expect(searchProducts({}).meta.total).toBe(0);

    restore();
    expect(searchProducts({}).meta.total).toBe(29);
  });

  it("makes every product reachable by its own id", () => {
    restore();
    // Ids are the API contract — a product that cannot be fetched by id is
    // unreachable from the detail page.
    for (const product of seedProducts) {
      expect(getProduct(product.id)).toBeDefined();
    }
    expect(getProduct("no-such-product")).toBeUndefined();
  });

  it("has no duplicate ids", () => {
    const ids = seedProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stores every price in whole cents", () => {
    const rows = getDb().prepare("SELECT price_cents, old_price_cents FROM products").all() as {
      price_cents: number;
      old_price_cents: number | null;
    }[];

    for (const row of rows) {
      expect(Number.isInteger(row.price_cents)).toBe(true);
      expect(row.price_cents).toBeGreaterThan(0);
      // A discounted product must actually be cheaper than its original price.
      if (row.old_price_cents !== null) {
        expect(Number.isInteger(row.old_price_cents)).toBe(true);
        expect(row.price_cents).toBeLessThan(row.old_price_cents);
      }
    }
  });

  it("points every product at a brand and a category that exist", () => {
    // Foreign keys are ON, so a bad reference would have thrown during the seed.
    const orphans = getDb()
      .prepare(
        `SELECT COUNT(*) AS count FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.slug = p.category_slug
         WHERE b.id IS NULL OR c.slug IS NULL`,
      )
      .get() as { count: number };

    expect(orphans.count).toBe(0);
  });

  it("gives every product at least one gallery image", () => {
    const missing = getDb()
      .prepare(
        `SELECT COUNT(*) AS count FROM products p
         WHERE NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id)`,
      )
      .get() as { count: number };

    expect(missing.count).toBe(0);
  });
});

describe("syncSearchIndex", () => {
  it("picks up a rename, so search cannot go stale", () => {
    restore();
    const db = getDb();

    db.prepare("UPDATE products SET name = 'Zzz Renamed Product' WHERE id = 'ice-cream'").run();

    // FTS rows are a copy, so they still hold the old name until a resync.
    expect(searchProducts({ q: "Ice Best" }).meta.total).toBe(1);
    expect(searchProducts({ q: "Zzz Renamed" }).meta.total).toBe(0);

    syncSearchIndex(db);
    expect(searchProducts({ q: "Zzz Renamed" }).meta.total).toBe(1);
    expect(searchProducts({ q: "Ice Best" }).meta.total).toBe(0);

    restore();
  });

  it("rebuilds from scratch without duplicating rows", () => {
    restore();
    const count = () =>
      (getDb().prepare("SELECT COUNT(*) AS count FROM products_fts").get() as { count: number })
        .count;

    const before = count();
    syncSearchIndex(getDb());
    expect(count()).toBe(before);
  });
});
