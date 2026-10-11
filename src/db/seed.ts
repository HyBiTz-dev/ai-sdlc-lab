import type { Database } from "better-sqlite3";
import { seedBrands, seedCategories, seedProducts, seedShelfFilters } from "@/db/seed-data";

/**
 * One-shot catalogue import. Runs automatically the first time the database
 * file is opened; `npm run db:reset` drops the rows and re-runs it.
 */

export function seedIfEmpty(db: Database) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
    count: number;
  };
  if (count > 0) return false;

  seed(db);
  return true;
}

export function seed(db: Database) {
  const insert = db.transaction(() => {
    const insertCategory = db.prepare(
      `INSERT INTO categories (slug, label, lines, icon, position)
       VALUES (@slug, @label, @lines, @icon, @position)`,
    );
    const insertBrand = db.prepare(
      `INSERT INTO brands (id, tag, promo_title, promo_image, promo_alt, promo_background, position)
       VALUES (@id, @tag, @promoTitle, @promoImage, @promoAlt, @promoBackground, @position)`,
    );
    const insertProduct = db.prepare(
      `INSERT INTO products (
         id, brand_id, category_slug, name, sku, unit, price_cents, old_price_cents,
         discount_badge, image, alt, rating, review_count, sold, total_stock, description, position
       ) VALUES (
         @id, @brandId, @category, @name, @sku, @unit, @priceCents, @oldPriceCents,
         @discountBadge, @image, @alt, @rating, @reviewCount, @sold, @totalStock, @description, @position
       )`,
    );
    const insertSpec = db.prepare(
      `INSERT INTO product_specs (product_id, label, value, position)
       VALUES (?, ?, ?, ?)`,
    );
    const insertHighlight = db.prepare(
      `INSERT INTO product_highlights (product_id, highlight, position)
       VALUES (?, ?, ?)`,
    );
    const insertImage = db.prepare(
      `INSERT INTO product_images (product_id, src, alt, position) VALUES (?, ?, ?, ?)`,
    );
    const insertShelf = db.prepare(
      `INSERT INTO product_shelves (product_id, shelf, position) VALUES (?, ?, ?)`,
    );
    const insertFilter = db.prepare(
      `INSERT INTO shelf_filters (shelf, label, position) VALUES (?, ?, ?)`,
    );

    seedCategories.forEach((category, index) =>
      insertCategory.run({
        ...category,
        lines: JSON.stringify(category.lines),
        position: index,
      }),
    );

    // better-sqlite3 throws on a missing named parameter even when the column
    // is nullable, so every promo key is passed explicitly as null.
    seedBrands.forEach((brand, index) =>
      insertBrand.run({
        position: index,
        promoTitle: null,
        promoImage: null,
        promoAlt: null,
        promoBackground: null,
        ...brand,
      }),
    );

    seedProducts.forEach((product, index) => {
      insertProduct.run({
        position: index,
        oldPriceCents: null,
        discountBadge: null,
        rating: null,
        reviewCount: null,
        sold: null,
        totalStock: null,
        ...product,
      });
      product.specs.forEach((entry, specIndex) =>
        insertSpec.run(product.id, entry.label, entry.value, specIndex),
      );
      product.highlights.forEach((highlight, highlightIndex) =>
        insertHighlight.run(product.id, highlight, highlightIndex),
      );
      // `gallery[0]` is always the hero shot at detail resolution, so it is
      // gallery position 0. Prepending `product.image` would add the same photo
      // a second time at card resolution (200px) and show a blurry duplicate.
      product.gallery.forEach((image, imageIndex) =>
        insertImage.run(product.id, image.src, image.alt, imageIndex),
      );
      product.shelves.forEach((shelf, shelfIndex) =>
        insertShelf.run(product.id, shelf, shelfIndex),
      );
    });

    seedShelfFilters.forEach((filter, index) =>
      insertFilter.run(filter.shelf, filter.label, index),
    );
  });

  insert();
  syncSearchIndex(db);
}

/**
 * Empties every table, FTS included. Used by `npm run db:reset` equivalents and
 * by tests that need to mutate rows and restore them.
 */
export function truncateAll(db: Database) {
  db.exec(`
    DELETE FROM product_images;
    DELETE FROM product_highlights;
    DELETE FROM product_specs;
    DELETE FROM product_shelves;
    DELETE FROM shelf_filters;
    DELETE FROM products;
    DELETE FROM brands;
    DELETE FROM categories;
    DELETE FROM products_fts;
  `);
}

/**
 * The FTS table stores the brand name inline, which triggers cannot read from a
 * joined table — so it is rebuilt explicitly after any write.
 */
export function syncSearchIndex(db: Database) {
  const rebuild = db.transaction(() => {
    db.prepare("DELETE FROM products_fts").run();
    db.prepare(
      `INSERT INTO products_fts (id, name, brand, sku, category, description)
       SELECT p.id, p.name, COALESCE(b.tag, ''), COALESCE(p.sku, ''),
              COALESCE(c.label, ''), COALESCE(p.description, '')
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.slug = p.category_slug`,
    ).run();
  });

  rebuild();
}

