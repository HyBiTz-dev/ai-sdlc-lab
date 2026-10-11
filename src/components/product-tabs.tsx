"use client";

import { useState } from "react";
import type { ProductDetailDto } from "@/lib/api-types";

type Tab = "description" | "specs" | "shipping";

const tabs: { id: Tab; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Specifications" },
  { id: "shipping", label: "Shipping & Returns" },
];

/**
 * Detail page copy lives in tabs rather than stacked sections — the band stays
 * one card tall and the amber underline matches the `filter tabs` treatment on
 * the Best Seller row.
 */
export function ProductTabs({ product }: { product: ProductDetailDto }) {
  const [active, setActive] = useState<Tab>("description");

  return (
    <div className="rounded-md border border-border bg-white">
      <div className="flex items-center gap-6 border-b border-[#f0f0f0] px-3.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`cursor-pointer border-none bg-transparent px-0 py-3 text-[11px] font-semibold transition-colors ${
              active === tab.id
                ? "border-b-2 border-primary text-[#222]"
                : "text-gray-text hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3.5 text-xs leading-5 text-gray-text">
        {active === "description" ? (
          <div>
            <p>{product.description ?? "Product description coming soon."}</p>
            {product.highlights?.length ? (
              <ul className="mt-3 list-none">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 py-1">
                    <i className="fa-solid fa-check mt-[3px] text-[9px] text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {active === "specs" ? (
          <dl className="grid gap-x-6 sm:grid-cols-2">
            {(product.specs ?? []).map((spec) => (
              <div
                key={spec.label}
                className="flex justify-between gap-4 border-b border-[#f0f0f0] py-2 last:border-b-0"
              >
                <dt className="text-[#999]">{spec.label}</dt>
                <dd className="text-right text-[#333]">{spec.value}</dd>
              </div>
            ))}
            {product.sku ? (
              <div className="flex justify-between gap-4 border-b border-[#f0f0f0] py-2">
                <dt className="text-[#999]">SKU</dt>
                <dd className="text-right text-[#333]">{product.sku}</dd>
              </div>
            ) : null}
            {product.unit ? (
              <div className="flex justify-between gap-4 border-b border-[#f0f0f0] py-2 last:border-b-0">
                <dt className="text-[#999]">Pack Size</dt>
                <dd className="text-right text-[#333]">{product.unit}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {active === "shipping" ? (
          <ul className="list-none">
            <li className="flex gap-2 border-b border-[#f0f0f0] py-2">
              <i className="fa-solid fa-truck-fast mt-[3px] w-3.5 text-[10px] text-primary" />
              Free delivery on orders over $50. Same-day dispatch before 3pm.
            </li>
            <li className="flex gap-2 border-b border-[#f0f0f0] py-2">
              <i className="fa-solid fa-box-open mt-[3px] w-3.5 text-[10px] text-primary" />
              Chilled items arrive in insulated packaging with ice packs.
            </li>
            <li className="flex gap-2 py-2">
              <i className="fa-solid fa-rotate-left mt-[3px] w-3.5 text-[10px] text-primary" />
              7-day returns on unopened items. Refunds land within 3 days.
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}