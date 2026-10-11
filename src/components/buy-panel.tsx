"use client";

import { useState } from "react";
import type { ProductDetailDto } from "@/lib/api-types";
import { formatPrice } from "@/lib/format";

/**
 * Buy panel for the detail page: `quantity-stepper` + `button-primary`.
 *
 * The stepper is the only control in the system that edits a number, so it
 * reuses `input-form` geometry (1px `{colors.hairline-input}`, `{rounded.sm}`,
 * 11px type) with square 36px step buttons on the flanks.
 */
export function BuyPanel({ product }: { product: ProductDetailDto }) {
  const max = product.total ?? 99;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const step = (delta: number) => {
    setQuantity((current) => Math.min(Math.max(current + delta, 1), max));
    setAdded(false);
  };

  const handleAdd = () => {
    setAdded(true);
  };

  const lineTotal = product.priceValue * quantity;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#222]">Quantity</span>
        <span className="text-[10px] text-[#999]">Max {max} per order</span>
      </div>

      <div className="flex gap-2.5">
        <div className="flex h-9 items-stretch overflow-hidden rounded border border-[#ddd] bg-white">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex w-9 cursor-pointer items-center justify-center border-none border-r border-[#ddd] bg-white text-[10px] text-[#555] transition-colors hover:bg-[#f7f7f7] hover:text-primary disabled:cursor-not-allowed disabled:text-[#ccc] disabled:hover:bg-white disabled:hover:text-[#ccc]"
          >
            <i className="fa-solid fa-minus" />
          </button>
          <span
            aria-live="polite"
            className="flex w-11 items-center justify-center text-[11px] font-semibold text-[#222]"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={quantity >= max}
            aria-label="Increase quantity"
            className="flex w-9 cursor-pointer items-center justify-center border-none border-l border-[#ddd] bg-white text-[10px] text-[#555] transition-colors hover:bg-[#f7f7f7] hover:text-primary disabled:cursor-not-allowed disabled:text-[#ccc] disabled:hover:bg-white disabled:hover:text-[#ccc]"
          >
            <i className="fa-solid fa-plus" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 cursor-pointer rounded border-none bg-primary py-[7px] text-[11px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {added ? "Added To Cart ✓" : "Add To Cart"}
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded bg-[#f7f7f7] px-3 py-2 text-[11px] text-gray-text">
        <span>
          {quantity} × {product.price}
        </span>
        <span className="text-[13px] font-bold text-[#222]">{formatPrice(lineTotal)}</span>
      </div>
    </div>
  );
}