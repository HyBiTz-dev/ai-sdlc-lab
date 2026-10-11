import type { Database } from "better-sqlite3";

/**
 * Schema is applied on every boot — every statement is `IF NOT EXISTS`, so the
 * migration step is idempotent and there is no separate migrate command to
 * forget. Add new migrations to the end of `MIGRATIONS`.
 */

const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS categories (
    slug       TEXT PRIMARY KEY,
    label      TEXT NOT NULL,
    lines      TEXT NOT NULL,
    icon       TEXT NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0
  );

  -- Promo columns are nullable: the table also holds brands that only appear
  -- as the vendor name on a product card.
  CREATE TABLE IF NOT EXISTS brands (
    id                TEXT PRIMARY KEY,
    tag               TEXT NOT NULL,
    promo_title       TEXT,
    promo_image       TEXT,
    promo_alt         TEXT,
    promo_background  TEXT,
    position          INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id               TEXT PRIMARY KEY,
    brand_id         TEXT NOT NULL REFERENCES brands(id),
    category_slug    TEXT REFERENCES categories(slug),
    name             TEXT NOT NULL,
    sku              TEXT,
    unit             TEXT,
    price_cents      INTEGER NOT NULL,
    old_price_cents  INTEGER,
    discount_badge   TEXT,
    image            TEXT NOT NULL,
    alt              TEXT NOT NULL,
    rating           REAL,
    review_count     INTEGER,
    sold             INTEGER,
    total_stock      INTEGER,
    description      TEXT,
    position         INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_slug);
  CREATE INDEX IF NOT EXISTS products_brand_idx    ON products(brand_id);
  CREATE INDEX IF NOT EXISTS products_price_idx    ON products(price_cents);

  CREATE TABLE IF NOT EXISTS product_specs (
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    value       TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_highlights (
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    highlight   TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_images (
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src         TEXT NOT NULL,
    alt         TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_shelves (
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shelf       TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shelf, product_id)
  );

  CREATE INDEX IF NOT EXISTS product_shelves_shelf_idx ON product_shelves(shelf, position);

  CREATE TABLE IF NOT EXISTS shelf_filters (
    shelf     TEXT NOT NULL,
    label     TEXT NOT NULL,
    position  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shelf, label)
  );
  `,

  // Standalone FTS index: brand and category live in other tables, so rows are
  // written by `syncSearchIndex()` rather than by triggers. Both are indexed
  // because shoppers search by them ("coffee" should find the coffees).
  `
  CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    id UNINDEXED,
    name,
    brand,
    sku,
    category,
    description,
    tokenize = 'unicode61'
  );
  `,
];

export function runMigrations(db: Database) {
  for (const statement of MIGRATIONS) {
    db.exec(statement);
  }
}
