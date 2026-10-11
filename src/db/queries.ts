import { getDb } from "@/db/client";
import { formatCents } from "@/lib/format";
import type {
  BrandDto,
  CategoryDto,
  FacetCount,
  GalleryImageDto,
  PageMetaDto,
  ProductDetailDto,
  ProductSummaryDto,
  SpecDto,
} from "@/lib/api-types";

/**
 * Every read the API does lives here. Route handlers stay thin: parse params,
 * call one of these, wrap in `ok()`.
 */

type ProductRow = {
  id: string;
  brand: string;
  category: string | null;
  name: string;
  sku: string | null;
  unit: string | null;
  price_cents: number;
  old_price_cents: number | null;
  discount_badge: string | null;
  image: string;
  alt: string;
  rating: number | null;
  review_count: number | null;
  sold: number | null;
  total_stock: number | null;
  description: string | null;
};

/** Joins every product query needs, without a leading `FROM`. */
const PRODUCT_JOINS = `
  JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.slug = p.category_slug
`;

const FROM_PRODUCTS = `FROM products p ${PRODUCT_JOINS}`;

const PRODUCT_COLUMNS = `
  p.id, p.name, p.sku, p.unit, p.price_cents, p.old_price_cents, p.discount_badge,
  p.image, p.alt, p.rating, p.review_count, p.sold, p.total_stock, p.description,
  b.tag AS brand, c.label AS category
`;

/** Drops null columns so optional DTO fields are absent rather than `null`. */
function compact<T extends object>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== null),
  ) as T;
}

function toSummary(row: ProductRow): ProductSummaryDto {
  const originalCents = row.old_price_cents;

  return compact<ProductSummaryDto>({
    id: row.id,
    brand: row.brand,
    name: row.name,
    image: row.image,
    alt: row.alt,
    price: formatCents(row.price_cents),
    priceValue: row.price_cents / 100,
    oldPrice: originalCents === null ? null : formatCents(originalCents),
    originalPrice: originalCents === null ? null : originalCents / 100,
    discount: row.discount_badge,
    // Always a positive magnitude. The badge is written "-20%" and the derived
    // value is 20, so the sign is normalised here — otherwise `discountRate`
    // would depend on whether a product happened to carry a hand-set badge.
    discountRate: row.discount_badge
      ? Math.abs(Number.parseInt(row.discount_badge, 10))
      : originalCents === null
        ? null
        : Math.round((1 - row.price_cents / originalCents) * 100),
    rating: row.rating,
    reviewCount: row.review_count,
    sold: row.sold,
    total: row.total_stock,
    inStock: row.total_stock === null ? null : (row.sold ?? 0) < row.total_stock,
    category: row.category,
    sku: row.sku,
    unit: row.unit,
  });
}

// ---------------------------------------------------------------- categories

type CategoryRow = { slug: string; label: string; lines: string; icon: string; product_count: number };

export function listCategories(): CategoryDto[] {
  const rows = getDb()
    .prepare(
      `SELECT c.slug, c.label, c.lines, c.icon, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_slug = c.slug
       GROUP BY c.slug
       ORDER BY c.position`,
    )
    .all() as CategoryRow[];

  return rows.map((row) => ({
    name: row.slug,
    label: row.label,
    // `lines` is the authored two-line break for the category tile, stored as
    // JSON so the tile never has to guess where "Fruits & Vegetables" wraps.
    lines: JSON.parse(row.lines) as string[],
    icon: row.icon,
    productCount: row.product_count,
  }));
}

export function getCategory(slug: string): CategoryDto | undefined {
  const target = slug.toLowerCase();
  return listCategories().find((category) => category.name === target);
}

// -------------------------------------------------------------------- brands

export function listBrands(): BrandDto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, tag, promo_title, promo_image, promo_alt, promo_background
       FROM brands
       WHERE promo_title IS NOT NULL
       ORDER BY position`,
    )
    .all() as {
    id: string;
    tag: string;
    promo_title: string;
    promo_image: string;
    promo_alt: string;
    promo_background: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    tag: row.tag,
    title: row.promo_title,
    image: row.promo_image,
    alt: row.promo_alt,
    background: row.promo_background,
  }));
}

// ------------------------------------------------------------------- shelves

export function getShelfFilters(shelf: string): string[] {
  const rows = getDb()
    .prepare(`SELECT label FROM shelf_filters WHERE shelf = ? ORDER BY position`)
    .all(shelf) as { label: string }[];
  return rows.map((row) => row.label);
}

/**
 * `"All"` is the first `shelf_filters` tab and is what a client sends for
 * "no category filter" — it is a sentinel, not a `categories.label`, so it must
 * not reach the `c.label = ?` predicate or the shelf comes back empty.
 */
function shelfCategoryFilter(label: string | undefined): string | null {
  if (label === undefined || label === "" || label === "All") return null;
  return label;
}

export function getShelfProducts(shelf: string, categoryLabel?: string): ProductSummaryDto[] {
  const category = shelfCategoryFilter(categoryLabel);
  const rows = getDb()
    .prepare(
      `SELECT ${PRODUCT_COLUMNS}
       FROM product_shelves s
       JOIN products p ON p.id = s.product_id
       ${PRODUCT_JOINS}
       WHERE s.shelf = ? AND (? IS NULL OR c.label = ?)
       ORDER BY s.position`,
    )
    .all(shelf, category, category) as ProductRow[];

  return rows.map(toSummary);
}

// ------------------------------------------------------------------ products

export type ProductQuery = {
  q?: string;
  category?: string;
  brand?: string;
  sort?: string;
  onSale?: boolean;
  page?: number;
  limit?: number;
};

/**
 * FTS5 throws on unbalanced quotes and stray operators, so the raw query is
 * reduced to word tokens and each becomes a quoted prefix term.
 * "sour cream" -> `"sour"* "cream"*`.
 */
export function toMatchQuery(raw: string): string | null {
  const tokens = raw.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  if (tokens.length === 0) return null;
  return tokens.map((token) => `"${token}"*`).join(" ");
}

/**
 * Sort keys mapped to ORDER BY clauses. Built with a `null` prototype so a
 * `sort` param cannot resolve an inherited `Object.prototype` member
 * (`constructor`, `toString`) and interpolate a function body into SQL.
 */
const SORTS: Record<string, string> = Object.assign(Object.create(null), {
  price_asc: "p.price_cents ASC",
  price_desc: "p.price_cents DESC",
  rating: "COALESCE(p.rating, 0) DESC, COALESCE(p.review_count, 0) DESC",
  best_selling: "COALESCE(p.sold, 0) DESC, p.position ASC",
});

/** Resolves a `sort` param to an ORDER BY clause, falling back to best-selling. */
export function orderByClause(sort: string | undefined): string {
  return sort !== undefined && Object.hasOwn(SORTS, sort) ? SORTS[sort] : SORTS.best_selling;
}

type Where = { join: string; where: string; params: unknown[] };

/** `skip` drops one filter so a facet can count results without its own filter. */
function buildWhere(query: ProductQuery, skip?: "category" | "brand"): Where {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const match = query.q ? toMatchQuery(query.q) : null;

  if (query.q) {
    if (match) {
      clauses.push("products_fts MATCH ?");
      params.push(match);
    } else {
      // Nothing searchable in the query — match nothing rather than everything.
      clauses.push("0");
    }
  }
  if (query.category && skip !== "category") {
    clauses.push("c.label = ?");
    params.push(query.category);
  }
  if (query.brand && skip !== "brand") {
    clauses.push("b.tag = ?");
    params.push(query.brand);
  }
  if (query.onSale) {
    clauses.push("p.old_price_cents IS NOT NULL");
  }

  return {
    join: query.q && match ? "JOIN products_fts ON products_fts.id = p.id" : "",
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function facetCounts(column: "c.label" | "b.tag", query: ProductQuery): FacetCount[] {
  const { join, where, params } = buildWhere(query, column === "c.label" ? "category" : "brand");
  const rows = getDb()
    .prepare(
      `SELECT ${column} AS value, ${column} AS label, COUNT(*) AS count
       ${FROM_PRODUCTS}
       ${join}
       ${where}
       GROUP BY ${column}
       HAVING ${column} IS NOT NULL
       ORDER BY count DESC, label ASC`,
    )
    .all(...params) as FacetCount[];

  return rows;
}

export type ProductSearchResult = {
  items: ProductSummaryDto[];
  meta: PageMetaDto;
  facets: { categories: FacetCount[]; brands: FacetCount[] };
};

export function searchProducts(query: ProductQuery): ProductSearchResult {
  const db = getDb();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  const { join, where, params } = buildWhere(query);
  const orderBy = query.q && toMatchQuery(query.q) ? "rank" : orderByClause(query.sort);

  const total = (
    db
      .prepare(`SELECT COUNT(*) AS count ${FROM_PRODUCTS} ${join} ${where}`)
      .get(...params) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS}
       ${FROM_PRODUCTS}
       ${join}
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, (page - 1) * limit) as ProductRow[];

  return {
    items: rows.map(toSummary),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    // Counts ignore the facet's own filter, so a shopper can see what switching
    // to another category or brand would give them.
    facets: {
      categories: facetCounts("c.label", query),
      brands: facetCounts("b.tag", query),
    },
  };
}

export function getProduct(id: string): ProductDetailDto | undefined {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${PRODUCT_COLUMNS} ${FROM_PRODUCTS} WHERE p.id = ?`)
    .get(id) as ProductRow | undefined;

  if (!row) return undefined;

  const specs = db
    .prepare(`SELECT label, value FROM product_specs WHERE product_id = ? ORDER BY position`)
    .all(id) as SpecDto[];
  const highlights = db
    .prepare(`SELECT highlight FROM product_highlights WHERE product_id = ? ORDER BY position`)
    .all(id) as { highlight: string }[];
  const images = db
    .prepare(`SELECT src, alt FROM product_images WHERE product_id = ? ORDER BY position`)
    .all(id) as GalleryImageDto[];

  return {
    ...toSummary(row),
    description: row.description ?? undefined,
    highlights: highlights.length ? highlights.map((entry) => entry.highlight) : undefined,
    specs: specs.length ? specs : undefined,
    gallery: images.length ? images : [{ src: row.image, alt: row.alt }],
  };
}

/** Same-brand products first, then everything else. Never the product itself. */
export function getRelatedProducts(id: string, limit = 6): ProductSummaryDto[] {
  const rows = getDb()
    .prepare(
      `SELECT ${PRODUCT_COLUMNS},
              CASE WHEN p.brand_id = (SELECT brand_id FROM products WHERE id = ?)
                   THEN 0 ELSE 1 END AS related_rank
       ${FROM_PRODUCTS}
       WHERE p.id != ?
       ORDER BY related_rank, COALESCE(p.sold, 0) DESC, p.position ASC
       LIMIT ?`,
    )
    .all(id, id, limit) as (ProductRow & { related_rank: number })[];

  return rows.map(toSummary);
}


