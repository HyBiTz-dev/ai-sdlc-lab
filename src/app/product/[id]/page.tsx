import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { BuyPanel } from "@/components/buy-panel";
import { Carousel, CarouselControls, CarouselItem } from "@/components/carousel";
import { Header, NavBar } from "@/components/header";
import { ProductCard, SectionHeader } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { PriceRow, RatingStars, StockTrack } from "@/components/product-parts";
import { ProductTabs } from "@/components/product-tabs";
import { getProductDetail, getRelated } from "@/lib/data";

/**
 * This route blocks on the product read instead of streaming a shell, because
 * the page has to know whether the product exists before it can commit to a
 * response. `instant = false` is what opts a blocking page out of the static
 * shell requirement under Cache Components.
 */
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) return { title: "Product not found - Farmart" };

  return {
    title: `${product.name} - Farmart`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) notFound();

  // Related is a nice-to-have; the page renders fine without it.
  const related = await getRelated(id, 6);

  const crumbs = [
    { label: "Home", href: "/" },
    ...(product.category
      ? [{ label: product.category, href: `/search?category=${encodeURIComponent(product.category)}` }]
      : []),
    { label: product.name },
  ];

  return (
    <>
      <Header />
      <NavBar />

      <main className="flex-1">
        <section className="bg-white">
          <div className="container-page">
            <Breadcrumb items={crumbs} />
          </div>
        </section>

        {/* Band 1 — overview. surface-band so the white cards read as objects. */}
        <section className="bg-light-gray py-6">
          <div className="container-page">
            <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
              <ProductGallery
                images={product.gallery}
                discount={product.discount}
                name={product.name}
              />

              <div className="rounded-md border border-border bg-white p-5">
                <span className="mb-1 block text-[10px] font-semibold tracking-[0.5px] text-[#999] uppercase">
                  {product.brand}
                </span>
                <h1 className="mb-2 text-[18px] leading-[1.5] font-bold text-[#1a1a1a]">
                  {product.name}
                </h1>

                {product.rating ? (
                  <div className="mb-3 flex items-center gap-2.5">
                    <RatingStars
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      className="mb-0"
                    />
                    <span className="text-[11px] text-[#f0f0f0]">|</span>
                    <span className="text-[11px] text-gray-text">
                      {product.reviewCount ?? 0} verified reviews
                    </span>
                  </div>
                ) : null}

                <PriceRow product={product} size="lg" className="mb-3" />

                {product.sold !== undefined && product.total !== undefined ? (
                  <StockTrack
                    sold={product.sold}
                    total={product.total}
                    showAvailability
                    className="mb-4"
                  />
                ) : null}

                <div className="mb-4 flex items-center gap-4 border-b border-[#f0f0f0] pb-4 text-[11px] text-gray-text">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-truck-fast text-[10px] text-primary" />
                    Free delivery over $50
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-shield-halved text-[10px] text-primary" />
                    7-day returns
                  </span>
                  {product.sku ? <span className="text-[#aaa]">SKU: {product.sku}</span> : null}
                </div>

                <BuyPanel product={product} />
              </div>
            </div>
          </div>
        </section>

        {/* Band 2 — description / specs / shipping. */}
        <section className="bg-white py-6">
          <div className="container-page">
            <ProductTabs product={product} />
          </div>
        </section>

        {/* Band 3 — related shelf. */}
        {related.length ? (
          <section className="bg-light-gray py-6">
            <div className="container-page">
              <Carousel
                trackId="related-track"
                header={
                  <SectionHeader
                    title="You May Also Like"
                    linkLabel="All Offers"
                    linkHref="/search"
                    trailing={<CarouselControls trackId="related-track" />}
                  />
                }
              >
                {related.map((item) => (
                  <CarouselItem
                    key={item.id}
                    itemClassName="w-[calc((100%-14px)/2)] sm:w-[calc((100%-28px)/3)] lg:w-[calc((100%-70px)/6)]"
                  >
                    <ProductCard product={item} columns="h-[100px]" />
                  </CarouselItem>
                ))}
              </Carousel>
            </div>
          </section>
        ) : null}

        <FooterNote />
      </main>
    </>
  );
}

/** Minimal closing band so the page ends on white, not on the band. */
function FooterNote() {
  return (
    <footer className="bg-white py-6">
      <div className="container-page flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[#222]">
          <i className="fa-solid fa-basket-shopping text-[17px] text-primary" />
          Farmart
        </Link>
        <p className="text-[11px] text-gray-text">
          Fresh groceries delivered daily · 8 800 332 65-66
        </p>
        <div className="mt-2 flex items-center gap-2.5 text-[#999]">
          <i className="fa-brands fa-facebook-f text-[14px]" />
          <i className="fa-brands fa-instagram text-[14px]" />
          <i className="fa-brands fa-youtube text-[14px]" />
          <i className="fa-brands fa-tiktok text-[14px]" />
        </div>
        <p className="mt-2 text-[10px] text-[#aaa]">
          © 2026 Farmart. All prices include VAT.
        </p>
      </div>
    </footer>
  );
}
