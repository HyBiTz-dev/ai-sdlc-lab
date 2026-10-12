"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { SearchSuggestions } from "@/components/search-suggestions";
import { suggestProducts } from "@/app/search/actions";
import type { CategoryDto, ProductSummaryDto } from "@/lib/api-types";

/** One suggestion query per pause in typing, rather than one per keystroke. */
const DEBOUNCE_MS = 200;

/** Matches `MIN_TERM` in `src/app/search/actions.ts`. */
const MIN_TERM = 2;

/**
 * Header search. Submitting navigates to `/search`, so the page itself stays a
 * server component and every filter state lives in the URL.
 *
 * While typing, a dropdown offers a few matching products so the shopper can
 * confirm a term without leaving the page for one keystroke too many. Picking
 * one fills the box with its full name and submits, rather than jumping to the
 * detail page — the search page is where the comparison happens.
 */
export function SearchBar({ categories }: { categories: CategoryDto[] }) {
  const router = useRouter();
  // Every page renders its own `Header`, so this mounts fresh on every
  // navigation and seeding from the URL is what keeps the box honest: landing
  // on `/search?q=milk&category=Milks%20%26%20Dairies` shows that term and that
  // category, and `category` is what scopes the suggestion query below.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [items, setItems] = useState<ProductSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, startTransition] = useTransition();
  /** Monotonic request id — a slow early keystroke must not win a race. */
  const requestId = useRef(0);
  /** Set once the shopper edits the box; a URL-seeded term must not open the list. */
  const edited = useRef(false);
  const listId = useId();

  const go = useCallback(
    (nextQuery: string, nextCategory: string) => {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      if (nextCategory) params.set("category", nextCategory);
      setOpen(false);
      setActiveIndex(-1);
      router.push(`/search?${params.toString()}`);
    },
    [router],
  );

  const load = useCallback(
    (term: string, nextCategory: string) => {
      const id = ++requestId.current;

      if (term.trim().length < MIN_TERM) {
        setItems([]);
        setTotal(0);
        setOpen(false);
        return;
      }

      startTransition(async () => {
        const result = await suggestProducts(term, nextCategory || undefined);
        if (requestId.current !== id) return;
        setItems(result.items);
        setTotal(result.total);
        setActiveIndex(-1);
        setOpen(true);
      });
    },
    [],
  );

  useEffect(() => {
    // The URL can arrive pre-filled, and dropping into `/search?q=milk` should
    // not pop the dropdown open over the results the shopper asked for.
    if (!edited.current) return;
    const timer = setTimeout(() => load(query, category), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, category, load]);

  const pick = (item: ProductSummaryDto) => {
    setQuery(item.name);
    go(item.name, category);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // `<input type="search">` clears itself on Escape as a browser default,
      // which would throw away the term the moment the shopper dismisses the
      // list. Escape closes the list and leaves the box alone.
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        // Wrapping has to start somewhere: with nothing highlighted, Down takes
        // the first row and Up the last, the way a native select does.
        if (current < 0) return step === -1 ? items.length - 1 : 0;
        return (current + step + items.length) % items.length;
      });
      return;
    }
    // Enter with a highlighted row selects it; otherwise the form's submit wins,
    // so the box still searches for exactly what was typed.
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(items[activeIndex]);
    }
  };

  return (
    <div
      className="relative w-full max-w-[520px] flex-1 max-md:order-3 max-lg:order-none"
      onBlur={(event) => {
        // Focus moving outside the whole box (tab to the cart, a click on the
        // page) closes the list. Clicks on a row keep focus on the input.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(query, category);
        }}
        className="flex w-full items-center overflow-hidden rounded border-2 border-primary bg-white"
      >
        <select
          aria-label="Category"
          value={category}
          onChange={(event) => {
            edited.current = true;
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
          onChange={(event) => {
            edited.current = true;
            setQuery(event.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="I'm searching for..."
          aria-label="Search products"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
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

      {open ? (
        <SearchSuggestions
          id={listId}
          items={items}
          total={total}
          term={query}
          activeIndex={activeIndex}
          loading={loading}
          onPick={pick}
          onSeeAll={() => go(query, category)}
        />
      ) : null}
    </div>
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
