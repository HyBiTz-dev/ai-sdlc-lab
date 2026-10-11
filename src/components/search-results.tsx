import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { FacetCount, ProductPageDto } from "@/lib/api-types";

/**
 * Result column of `/search`: facets on the left, grid and pagination on the
 * right. Every control is a link, so the whole thing renders on the server.
 *
 * `searchParams` is the raw URL object, not the filtered query, because these
 * links must preserve anything the user already has in the URL.
 */

type SearchParams = Record<string, string | string[] | undefined>;

function read(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value ? value : undefined;
}

/** Builds a `/search` URL with `patch` applied and `page` reset. */
function href(current: SearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    if (typeof value === "string" && value && !(key in patch)) {
      next.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  if (!("page" in patch)) next.delete("page");

  return `/search?${next.toString()}`;
}

function FacetGroup({
  title,
  facets,
  current,
  param,
}: {
  title: string;
  facets: FacetCount[];
  current: SearchParams;
  param: string;
}) {
  if (facets.length === 0) return null;
  const active = read(current, param);

  return (
    <div className="border-b border-[#f0f0f0] py-4 first:pt-0">
      <h3 className="mb-2.5 text-[11px] font-semibold text-[#222]">{title}</h3>
      <ul className="list-none space-y-1.5">
        <li>
          <Link
            href={href(current, { [param]: null, page: null })}
            className={`flex items-center justify-between text-[11px] ${
              active ? "text-gray-text hover:text-primary" : "font-semibold text-primary"
            }`}
          >
            All
            <span className="text-[10px] text-[#aaa]">{facets.reduce((sum, f) => sum + f.count, 0)}</span>
          </Link>
        </li>
        {facets.map((facet) => (
          <li key={facet.value}>
            <Link
              href={href(current, { [param]: facet.value })}
              className={`flex items-center justify-between text-[11px] ${
                active === facet.value ? "font-semibold text-primary" : "text-gray-text hover:text-primary"
              }`}
            >
              <span className="truncate">{facet.label}</span>
              <span className="text-[10px] text-[#aaa]">{facet.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pagination({
  meta,
  current,
}: {
  meta: ProductPageDto["meta"];
  current: SearchParams;
}) {
  if (meta.totalPages <= 1) return null;

  // Window of at most 5 pages around the current one.
  const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
  const pages = Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => start + i);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {meta.page > 1 ? (
        <Link
          href={href(current, { page: String(meta.page - 1) })}
          className="rounded border border-border bg-white px-2.5 py-1.5 text-[11px] text-[#555] hover:border-primary hover:text-primary"
        >
          Prev
        </Link>
      ) : null}

      {pages.map((page) => (
        <Link
          key={page}
          href={href(current, { page: String(page) })}
          aria-current={page === meta.page ? "page" : undefined}
          className={`rounded border px-2.5 py-1.5 text-[11px] ${
            page === meta.page
              ? "border-primary bg-primary font-semibold text-white"
              : "border-border bg-white text-[#555] hover:border-primary hover:text-primary"
          }`}
        >
          {page}
        </Link>
      ))}

      {meta.page < meta.totalPages ? (
        <Link
          href={href(current, { page: String(meta.page + 1) })}
          className="rounded border border-border bg-white px-2.5 py-1.5 text-[11px] text-[#555] hover:border-primary hover:text-primary"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}

export function SearchResults({
  result,
  searchParams,
}: {
  result: ProductPageDto;
  searchParams: SearchParams;
}) {
  const { items, meta, facets } = result;
  const term = read(searchParams, "q");
  const activeCategory = read(searchParams, "category");
  const activeBrand = read(searchParams, "brand");
  const hasFilters = Object.values(searchParams).some(
    (value) => typeof value === "string" && value,
  );

  const summary = [
    term ? `results for “${term}”` : null,
    activeCategory ? `in ${activeCategory}` : null,
    activeBrand ? `by ${activeBrand}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="self-start rounded-md border border-border bg-white p-4">
        <FacetGroup
          title="Category"
          facets={facets?.categories ?? []}
          current={searchParams}
          param="category"
        />
        <FacetGroup
          title="Brand"
          facets={facets?.brands ?? []}
          current={searchParams}
          param="brand"
        />
        {hasFilters ? (
          <Link
            href="/search"
            className="mt-4 inline-block text-[11px] font-semibold text-primary hover:underline"
          >
            Clear all filters
          </Link>
        ) : null}
      </aside>

      <div className="min-w-0">
        {items.length === 0 ? (
          <div className="rounded-md border border-border bg-white px-6 py-16 text-center">
            <i className="fa-solid fa-magnifying-glass mb-3 text-[26px] text-[#ccc]" />
            <h2 className="mb-1.5 text-[15px] font-bold text-[#1a1a1a]">No products found</h2>
            <p className="text-xs text-gray-text">
              {summary ? `We could not find anything ${summary}.` : "Try a different search."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-gray-text">
              <strong className="text-[#222]">{meta.total}</strong>{" "}
              {meta.total === 1 ? "product" : "products"}
              {summary ? ` ${summary}` : ""}
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} columns="h-[120px]" />
              ))}
            </div>

            <Pagination meta={meta} current={searchParams} />
          </>
        )}
      </div>
    </div>
  );
}
