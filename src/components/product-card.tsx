import Image from "next/image";
import Link from "next/link";
import type { ProductSummaryDto } from "@/lib/api-types";
import { PriceRow, RatingStars, StockTrack } from "@/components/product-parts";

export function SectionHeader({
  title,
  linkLabel,
  linkHref = "#",
  action,
  trailing,
}: {
  title: string;
  linkLabel?: string;
  linkHref?: string;
  action?: React.ReactNode;
  /** controls pinned to the far right of the header row */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-7 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 text-lg leading-7 font-bold text-[#1a1a1a]">
        {title}
        {linkLabel ? (
          <Link href={linkHref} className="text-xs font-normal text-gray-text">
            {linkLabel} &gt;
          </Link>
        ) : null}
        {action}
      </div>
      {trailing}
    </div>
  );
}

export function ProductCard({
  product,
  columns,
}: {
  product: ProductSummaryDto;
  columns?: string;
}) {
  const hasStock = product.sold !== undefined && product.total !== undefined;
  const href = `/product/${product.id}`;

  return (
    <div className="relative flex h-full flex-col rounded-md border border-border bg-white p-3.5 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      {product.discount ? (
        <span className="absolute left-2.5 top-2.5 rounded-sm bg-badge-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {product.discount}
        </span>
      ) : null}

      <Link
        href={href}
        aria-label={product.name}
        className={`mb-3 flex items-center justify-center ${columns ?? "h-[120px]"}`}
      >
        <Image
          src={product.image}
          alt={product.alt}
          width={140}
          height={140}
          className="max-h-full max-w-full object-contain"
        />
      </Link>

      <span className="mb-1 text-[10px] text-[#999] uppercase">{product.brand}</span>

      <Link href={href}>
        <div className="clamp-2 mb-2 h-[34px] text-xs font-semibold leading-[1.4] text-[#333] hover:text-primary">
          {product.name}
        </div>
      </Link>

      {product.rating ? (
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
      ) : null}

      <PriceRow product={product} className="mb-2.5" />

      {hasStock ? (
        <StockTrack
          sold={product.sold as number}
          total={product.total as number}
          className="mb-2.5"
        />
      ) : null}

      <button
        type="button"
        className="mt-auto w-full cursor-pointer rounded border-none bg-primary py-[7px] text-[11px] font-semibold text-white hover:bg-primary-hover"
      >
        Add To Cart
      </button>
    </div>
  );
}