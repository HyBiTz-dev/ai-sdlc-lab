import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Carousel, CarouselControls, CarouselItem } from "@/components/carousel";
import { ProductCard, SectionHeader } from "@/components/product-card";
import { getBestSellers, getBrands, getCategories, getTopSavers } from "@/lib/data";

/**
 * Homepage shelves. Each shelf is a separate component so a future per-request
 * read in one of them cannot hold up the whole page, and each export keeps its
 * own `<Suspense>` boundary.
 */

/** Grey block the size of the content it stands in for. */
function ShelfSkeleton({ className = "h-[140px]" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[#ececec] ${className}`} />;
}

async function CategoryTiles() {
  const items = await getCategories();

  return (
    <Carousel
      trackId="categories-track"
      header={
        <SectionHeader
          title="Browse by Category"
          linkLabel="All Categories"
          trailing={<CarouselControls trackId="categories-track" />}
        />
      }
    >
      {items.map((category) => (
        <CarouselItem
          key={category.name}
          itemClassName="w-[calc((100%-14px)/2)] sm:w-[calc((100%-42px)/4)] lg:w-[calc((100%-98px)/8)]"
        >
          <Link
            href={`/search?category=${encodeURIComponent(category.label)}`}
            className="flex h-full cursor-pointer flex-col justify-center rounded-lg border border-border bg-white px-2 py-4 text-center transition-all hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-2.5 flex h-9 items-center justify-center text-[26px] text-primary">
              <i className={category.icon} />
            </div>
            <div className="text-[11px] font-medium leading-[1.3] text-[#333]">
              {category.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-[#aaa]">
              {category.productCount} products
            </div>
          </Link>
        </CarouselItem>
      ))}
    </Carousel>
  );
}

export function BrowseByCategory() {
  return (
    <section className="py-5">
      <div className="container-page">
        <Suspense fallback={<ShelfSkeleton className="h-[180px]" />}>
          <CategoryTiles />
        </Suspense>
      </div>
    </section>
  );
}

async function BrandTiles() {
  const items = await getBrands();

  return (
    <Carousel
      trackId="brands-track"
      header={
        <SectionHeader
          title="Featured Brands"
          linkLabel="All Offers"
          trailing={<CarouselControls trackId="brands-track" />}
        />
      }
    >
      {items.map((brand) => (
        <CarouselItem
          key={brand.id}
          itemClassName="w-[calc((100%-14px)/2)] lg:w-[calc((100%-42px)/4)]"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-[#f8f9fa]">
            <div
              className="flex h-[140px] items-center justify-center p-4"
              style={{ background: brand.background }}
            >
              <Image
                src={brand.image}
                alt={brand.alt}
                width={160}
                height={120}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="border-t border-[#f0f0f0] bg-white p-3">
              <span className="mb-1 block text-[10px] font-semibold text-[#999] uppercase">
                {brand.tag}
              </span>
              <div className="truncate text-xs font-semibold text-[#222]">{brand.title}</div>
            </div>
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  );
}

export function FeaturedBrands() {
  return (
    <section className="py-6">
      <div className="container-page">
        <Suspense fallback={<ShelfSkeleton className="h-[220px]" />}>
          <BrandTiles />
        </Suspense>
      </div>
    </section>
  );
}

async function TopSaverShelf() {
  const items = await getTopSavers();

  return (
    <div className="min-w-0">
      <SectionHeader
        title="Top Saver Today"
        linkLabel="All Offers"
        linkHref="/search?onSale=true&sort=price_asc"
        action={
          <span className="rounded bg-badge-red px-2 py-[3px] text-[11px] font-normal text-white">
            Expires in: 08 : 25 : 37
          </span>
        }
        trailing={<CarouselControls trackId="top-savers-track" />}
      />
      <Carousel trackId="top-savers-track">
        {items.map((product) => (
          <CarouselItem
            key={product.id}
            itemClassName="w-[calc((100%-14px)/2)] sm:w-[calc((100%-28px)/3)] lg:w-[calc((100%-42px)/4)]"
          >
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </Carousel>
    </div>
  );
}

export function TopSaverToday() {
  return (
    <section className="py-6">
      <div className="container-page">
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1fr]">
          <Suspense fallback={<ShelfSkeleton className="h-[300px]" />}>
            <TopSaverShelf />
          </Suspense>

          <div className="flex h-full self-stretch flex-col justify-center rounded-lg border border-[#ffeed4] bg-[#fff9f0] px-[18px] py-6 text-center">
            <h3 className="mb-1 text-2xl font-bold text-badge-red">15% OFF</h3>
            <p className="mb-[18px] text-[11px] text-[#666]">
              For new member sign up at the first time
            </p>
            <div className="relative mb-2.5">
              <i className="fa-regular fa-envelope absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
              <input
                type="email"
                placeholder="yourdetail@gmail.com"
                className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
              />
            </div>
            <div className="relative mb-2.5">
              <i className="fa-solid fa-lock absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
              <input
                type="password"
                placeholder="Set Your Password"
                className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
              />
            </div>
            <button
              type="button"
              className="mt-1 cursor-pointer rounded border-none bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

async function BestSellerShelf({ category }: { category?: string }) {
  const { items, filters } = await getBestSellers(category);

  return (
    <Carousel
      trackId="best-sellers-track"
      header={
        <SectionHeader
          title="Best Seller"
          trailing={<CarouselControls trackId="best-sellers-track" />}
          action={
            <ul className="hidden list-none gap-4 text-xs text-gray-text lg:flex">
              {filters.map((filter) => (
                <li key={filter}>
                  <Link
                    href={
                      filter === "All"
                        ? "/"
                        : `/search?category=${encodeURIComponent(filter)}`
                    }
                    className={
                      filter === (category ?? "All")
                        ? "border-b-2 border-primary font-semibold text-[#222]"
                        : "cursor-pointer"
                    }
                  >
                    {filter}
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      }
    >
      {items.map((product) => (
        <CarouselItem
          key={product.id}
          itemClassName="w-[calc((100%-14px)/2)] sm:w-[calc((100%-28px)/3)] lg:w-[calc((100%-70px)/6)]"
        >
          <ProductCard product={product} columns="h-[100px]" />
        </CarouselItem>
      ))}
    </Carousel>
  );
}

export function BestSeller({ category }: { category?: string }) {
  return (
    <section className="bg-light-gray pb-10 pt-6">
      <div className="container-page">
        <Suspense fallback={<ShelfSkeleton className="h-[260px]" />}>
          <BestSellerShelf category={category} />
        </Suspense>
      </div>
    </section>
  );
}
