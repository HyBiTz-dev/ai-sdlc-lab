"use client";

import Image from "next/image";
import { Panel } from "@/components/design-system/shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { BuyPanel } from "@/components/buy-panel";
import { ProductGallery } from "@/components/product-gallery";
import { PriceRow, RatingStars, StockTrack } from "@/components/product-parts";
import { ProductTabs } from "@/components/product-tabs";
import type { ProductDetailDto } from "@/lib/api-types";

const demo: ProductDetailDto = {
  id: "demo",
  brand: "Meat Brand",
  name: "British Beef Mince (20% Fat)",
  price: "$4.75",
  priceValue: 4.75,
  oldPrice: "$5.90",
  originalPrice: 5.9,
  discount: "-20%",
  image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",
  alt: "Beef mince",
  rating: 4,
  reviewCount: 8,
  sold: 16,
  total: 40,
  category: "Raw Meats",
  sku: "FM-BM-20-500",
  unit: "500g pack",
  description:
    "British beef minced to a 20% fat ratio — enough for a rich burger, lean enough for a weeknight bolognese.",
  highlights: [
    "20% fat ratio, coarse ground",
    "Chilled and vacuum sealed",
    "Butchered to order daily",
  ],
  specs: [
    { label: "Net Weight", value: "500g" },
    { label: "Fat Ratio", value: "20%" },
    { label: "Storage", value: "Keep refrigerated 0-4°C" },
  ],
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",
      alt: "Beef mince",
    },
    {
      src: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=700&q=80",
      alt: "Beef tray",
    },
    {
      src: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=700&q=80",
      alt: "Beef cuts",
    },
  ],
};

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[12px] font-semibold text-[#222]">{children}</div>;
}

export function ProductSpecimens() {
  return (
    <>
      <div className="mb-4">
        <Label>breadcrumb</Label>
        <Panel className="!py-2">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Raw Meats" },
              { label: "British Beef Mince (20% Fat)" },
            ]}
          />
        </Panel>
      </div>

      <div className="mb-4">
        <Label>gallery-frame + thumb-gallery</Label>
        <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
          <ProductGallery images={demo.gallery ?? []} discount={demo.discount} name={demo.name} />
          <Panel className="flex flex-col">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.5px] text-[#999] uppercase">
              {demo.brand}
            </span>
            <h3 className="mb-2 text-[18px] leading-[1.5] font-bold text-[#1a1a1a]">{demo.name}</h3>
            <RatingStars rating={demo.rating ?? 0} reviewCount={demo.reviewCount} className="mb-3" />
            <PriceRow product={demo} size="lg" className="mb-3" />
            <StockTrack sold={demo.sold ?? 0} total={demo.total ?? 0} showAvailability className="mb-4" />
            <div className="mb-4 flex items-center gap-4 border-b border-[#f0f0f0] pb-4 text-[11px] text-[#71717a]">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-truck-fast text-[10px] text-primary" />
                Free delivery over $50
              </span>
              <span className="text-[#aaa]">SKU: {demo.sku}</span>
            </div>
            <BuyPanel product={demo} />
          </Panel>
        </div>
        <p className="mt-3 text-[10px] leading-[1.5] text-[#71717a]">
          <code>card-detail</code> holds the eyebrow, name, rating, price, stock track and buy panel. The
          frame keeps <code>object-contain</code> so the photo never fills the card.
        </p>
      </div>

      <div className="mb-4">
        <Label>tab-detail</Label>
        <ProductTabs product={demo} />
      </div>

      <div className="mb-4">
        <Label>card detail parts</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel>
            <div className="mb-2 text-[11px] font-semibold text-[#222]">PriceRow</div>
            <PriceRow product={demo} size="lg" />
            <div className="mt-3 mb-2 text-[11px] font-semibold text-[#222]">RatingStars</div>
            <RatingStars rating={demo.rating ?? 0} reviewCount={demo.reviewCount} className="mb-0" />
          </Panel>
          <Panel>
            <div className="mb-2 text-[11px] font-semibold text-[#222]">StockTrack</div>
            <StockTrack sold={demo.sold ?? 0} total={demo.total ?? 0} showAvailability />
            <div className="mt-3 flex items-center gap-3">
              <Image
                src={demo.gallery?.[1]?.src ?? demo.image}
                alt={demo.alt}
                width={48}
                height={48}
                className="h-12 w-12 rounded-sm border border-[#ebebeb] object-contain"
              />
              <span className="text-[10px] leading-[1.5] text-[#71717a]">
                Thumbnails are 64×64, `{`{rounded.sm}`}`, hairline bordered — the selected one lifts to
                amber.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}