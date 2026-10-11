import type { ProductSummaryDto } from "@/lib/api-types";

/** `pill-star` — 10px stars in `{colors.star}` with a grey review count. */
export function RatingStars({
  rating,
  reviewCount,
  className = "mb-2",
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 text-[10px] text-[#ffc107] ${className}`}>
      {Array.from({ length: rating }).map((_, index) => (
        <i key={index} className="fa-solid fa-star" />
      ))}
      {reviewCount !== undefined ? (
        <span className="text-[#999]">({String(reviewCount).padStart(2, "0")})</span>
      ) : null}
    </div>
  );
}

/** Price row — `{colors.alert}` 14px/700 wins over the ghosted original. */
export function PriceRow({
  product,
  size = "sm",
  className = "",
}: {
  product: Pick<ProductSummaryDto, "price" | "oldPrice">;
  /** `sm` = card price, `lg` = detail page headline price */
  size?: "sm" | "lg";
  className?: string;
}) {
  const priceClass =
    size === "lg" ? "text-[22px] leading-[1.25]" : "text-sm leading-[1.5]";

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`font-bold text-badge-red ${priceClass}`}>{product.price}</span>
      {product.oldPrice ? (
        <span className="text-[11px] text-[#aaa] line-through">{product.oldPrice}</span>
      ) : null}
    </div>
  );
}

/** Stock track — 5px bar, amber fill, `Sold: 28/40` caption below. */
export function StockTrack({
  sold,
  total,
  className = "",
  showAvailability = false,
}: {
  sold: number;
  total: number;
  className?: string;
  /** detail page pairs the sold count with an availability note */
  showAvailability?: boolean;
}) {
  const soldPercent = total > 0 ? Math.min((sold / total) * 100, 100) : 0;

  return (
    <div className={className}>
      <div className="h-[5px] w-full overflow-hidden rounded-[10px] bg-[#eee]">
        <div className="h-full bg-primary" style={{ width: `${soldPercent}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-text">
        <span>
          Sold: {String(sold).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        {showAvailability ? <span className="text-primary">In stock</span> : null}
      </div>
    </div>
  );
}

/** `badge-discount` — absolute-friendly pill, reused on cards and the detail gallery. */
export function DiscountBadge({
  discount,
  className = "",
}: {
  discount: string;
  className?: string;
}) {
  return (
    <span
      className={`rounded-sm bg-badge-red px-1.5 py-0.5 text-[10px] font-semibold text-white ${className}`}
    >
      {discount}
    </span>
  );
}