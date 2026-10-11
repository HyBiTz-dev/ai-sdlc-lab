"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CategoryDto } from "@/lib/api-types";

/**
 * Header search. Submitting navigates to `/search`, so the page itself stays a
 * server component and every filter state lives in the URL.
 */
export function SearchBar({ categories }: { categories: CategoryDto[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const go = (nextQuery: string, nextCategory: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        go(query, category);
      }}
      className="flex w-full max-w-[520px] flex-1 items-center overflow-hidden rounded border-2 border-primary bg-white max-md:order-3 max-lg:order-none"
    >
      <select
        aria-label="Category"
        value={category}
        onChange={(event) => {
          setCategory(event.target.value);
          go(query, event.target.value);
        }}
        className="cursor-pointer border-none border-r border-[#e2e2e2] bg-[#f7f7f7] py-3 pl-4 pr-4 text-[13px] text-[#555] outline-none"
      >
        <option value="">All Categories</option>
        {categories.map((entry) => (
          <option key={entry.name} value={entry.label}>
            {entry.label}
          </option>
        ))}
      </select>

      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="I'm searching for..."
        aria-label="Search products"
        className="flex-1 border-none px-4 py-3 text-[13px] outline-none"
      />

      <button
        type="submit"
        aria-label="Search"
        className="cursor-pointer border-none bg-transparent px-5 text-[15px] text-[#666]"
      >
        <i className="fa-solid fa-magnifying-glass" />
      </button>
    </form>
  );
}

/** Same geometry as `SearchBar`, no data — shown while categories load. */
export function SearchBarFallback() {
  return (
    <div className="flex h-[46px] w-full max-w-[520px] flex-1 items-center overflow-hidden rounded border-2 border-primary bg-white max-md:order-3 max-lg:order-none">
      <div className="h-full w-[150px] animate-pulse bg-[#f2f2f2]" />
      <div className="h-full flex-1 animate-pulse bg-[#fafafa]" />
    </div>
  );
}
