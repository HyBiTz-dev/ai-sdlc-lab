"use client";

import Image from "next/image";
import type { ProductSummaryDto } from "@/lib/api-types";

/**
 * The suggestion list under the header search box.
 *
 * Presentational only — the query, the debounce and the open/active state all
 * live in `SearchBar`, which renders it. Follows the ARIA combobox pattern:
 * the input keeps focus and points at the active row with `aria-activedescendant`
 * (wired up by the parent), so the rows themselves are never tab stops.
 */
export function SearchSuggestions({
  id,
  items,
  total,
  term,
  activeIndex,
  loading,
  onPick,
  onSeeAll,
}: {
  id: string;
  items: ProductSummaryDto[];
  total: number;
  term: string;
  activeIndex: number;
  loading: boolean;
  onPick: (item: ProductSummaryDto) => void;
  onSeeAll: () => void;
}) {
  const more = Math.max(0, total - items.length);

  return (
    <div className="absolute inset-x-0 top-full z-50 mt-1 rounded border border-border bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <ul id={id} role="listbox" aria-label="Search suggestions" className="list-none p-1.5">
        {items.map((item, index) => (
          <li
            key={item.id}
            id={`${id}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // The rows fill the box rather than link to the page, so the product
            // id has nowhere else to live — the e2e suite reads it from here.
            data-product-id={item.id}
            // Keeps focus on the input, so the blur that would close the list
            // never fires before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(item)}
            className={`flex cursor-pointer items-center gap-3 rounded px-2 py-2 ${
              index === activeIndex ? "bg-secondary-bg" : "hover:bg-light-gray"
            }`}
          >
            <Image
              src={item.image}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-sm object-contain"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] uppercase text-gray-text">
                {item.brand}
              </span>
              <span className="clamp-2 block text-[13px] leading-tight text-[#1a1a1a]">
                {item.name}
              </span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              {item.price}
            </span>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="px-3.5 py-3 text-[12px] text-gray-text">
          No matching products — press Enter to search anyway.
        </p>
      ) : null}

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSeeAll}
        className="flex w-full cursor-pointer items-center justify-between border-t border-border px-3.5 py-2.5 text-left text-[12px] text-gray-text hover:text-primary"
      >
        <span>
          {loading
            ? "Searching…"
            : `See all ${total} result${total === 1 ? "" : "s"} for “${term.trim()}”`}
        </span>
        {more > 0 ? (
          <span className="shrink-0 text-[11px]">+{more} more</span>
        ) : null}
      </button>
    </div>
  );
}
