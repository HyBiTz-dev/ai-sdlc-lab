"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_SORT, SORT_OPTIONS, toSortKey } from "@/lib/sorts";

/**
 * Sort and discount controls. They write back to the URL rather than holding
 * state, so the result set stays shareable and the back button works.
 */

function withParam(params: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(params.toString());
  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }
  // Any filter change invalidates the current page number.
  if (key !== "page") next.delete("page");
  return next;
}

export function SearchControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A `sort` outside the allowlist falls back to the default, so the controlled
  // <select> always has a matching <option> instead of rendering blank.
  const sort = toSortKey(searchParams.get("sort")) ?? DEFAULT_SORT;
  const onSale = searchParams.get("onSale") === "true";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        aria-pressed={onSale}
        onClick={() => {
          const next = withParam(searchParams, "onSale", onSale ? null : "true");
          router.push(`/search?${next.toString()}`);
        }}
        className={`cursor-pointer rounded border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
          onSale
            ? "border-primary bg-primary text-white"
            : "border-border bg-white text-[#555] hover:border-primary hover:text-primary"
        }`}
      >
        On sale only
      </button>

      <label className="flex items-center gap-2 text-[11px] text-gray-text">
        Sort by
        <select
          value={sort}
          onChange={(event) => {
            const next = withParam(searchParams, "sort", event.target.value);
            router.push(`/search?${next.toString()}`);
          }}
          className="cursor-pointer rounded border border-border bg-white px-2.5 py-1.5 text-[11px] text-[#333] outline-none focus:border-primary"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
