import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Header, NavBar } from "@/components/header";
import { SearchControls } from "@/components/search-controls";
import { SearchResults } from "@/components/search-results";
import { searchCatalogue } from "@/lib/data";
import { toSortKey } from "@/lib/sorts";
import type { ProductQuery } from "@/db/queries";

export const metadata: Metadata = {
  title: "Search - Farmart",
  description: "Search the Farmart catalogue by name, brand or category.",
};

const PER_PAGE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

/** Only these keys become query params — everything else in the URL is ignored. */
type FilterKey = "q" | "category" | "brand" | "sort" | "onSale" | "page";

function toQuery(params: SearchParams): { query: ProductQuery; term?: string } {
  const value = (key: FilterKey) => {
    const entry = params[key];
    return typeof entry === "string" && entry ? entry : undefined;
  };

  // Same allowlist the API route uses, so a hand-edited `?sort=` cannot reach
  // the query layer with a value it has no ORDER BY clause for.
  return {
    query: {
      q: value("q"),
      category: value("category"),
      brand: value("brand"),
      sort: toSortKey(value("sort")),
      onSale: value("onSale") === "true",
      page: Number.parseInt(value("page") ?? "1", 10) || 1,
      limit: PER_PAGE,
    },
    term: value("q"),
  };
}

/**
 * `searchParams` is request-time data, so the promise is passed straight
 * through and awaited inside the Suspense boundary — awaiting it in the page
 * body would block prerendering.
 */
async function Results({ params }: { params: Promise<SearchParams> }) {
  const resolved = await params;
  const { query, term } = toQuery(resolved);
  const result = await searchCatalogue(query);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#1a1a1a]">
          {term ? `Search: ${term}` : "All Products"}
        </h1>
        <SearchControls />
      </div>
      <SearchResults result={result} searchParams={resolved} />
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="h-[280px] animate-pulse rounded-md bg-white" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-[260px] animate-pulse rounded-md bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <Header />
      <NavBar />

      <main className="flex-1 bg-light-gray py-6">
        <div className="container-page">
          <div className="rounded-md border border-border bg-white px-4">
            <Breadcrumb
              items={[{ label: "Home", href: "/" }, { label: "Search" }]}
            />
          </div>

          <div className="mt-5">
            <Suspense fallback={<ResultsSkeleton />}>
              <Results params={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
