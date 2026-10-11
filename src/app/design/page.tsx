import Image from "next/image";
import Link from "next/link";
import { Hex, Panel, Section, Spec, SpecRow } from "@/components/design-system/shell";
import { DialogSpecimens } from "@/components/design-system/dialog-specimens";
import { ProductSpecimens } from "@/components/design-system/product-specimens";
import {
  brandAccent,
  breakpoints,
  donts,
  dos,
  elevation,
  functional,
  hairlines,
  heroGradients,
  inks,
  radiusScale,
  spacingScale,
  surfaces,
  typeScale,
} from "@/lib/design-tokens";

const nav = [
  { id: "principles", label: "Principles" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Layout" },
  { id: "elevation", label: "Elevation" },
  { id: "shapes", label: "Shapes" },
  { id: "components", label: "Components" },
  { id: "guidelines", label: "Guidelines" },
  { id: "responsive", label: "Responsive" },
];

export default function DesignSystemPage() {
  return (
    <>
      {/* Page header — mirrors the storefront header language: white, no divider. */}
      <header className="bg-white">
        <div className="container-page">
          <div className="flex flex-col items-center gap-5 py-8 md:flex-row md:gap-14">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-2xl font-bold text-[#1a1a1a]">
              <i className="fa-solid fa-basket-shopping text-[26px] text-primary" />
              Farmart
            </Link>
            <p className="text-sm text-[#71717a]">
              Design system — generated from <code className="text-xs font-semibold text-[#222]">DESIGN.md</code>
            </p>
            <Link
              href="/"
              className="ml-auto rounded bg-primary px-5 py-2 text-[11px] font-semibold text-white hover:bg-primary-hover"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-[#ebebeb] bg-white">
        <div className="container-page">
          <ul className="flex list-none gap-6 overflow-x-auto py-3 text-[12px] font-medium text-[#333]">
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="whitespace-nowrap">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <main>
        <Spec>
          <div className="container-page">
            <Section
              id="principles"
              title="Principles"
              lead="Farmart is a dense, discount-led grocery storefront. Density beats whitespace almost everywhere; the only breathing room is inside the hero banners. Two accent colours carry distinct meanings and must never swap."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                  <div className="mb-2 text-[13px] font-semibold text-[#222]">
                    Amber is the brand and the action colour
                  </div>
                  <p className="text-xs leading-5 text-[#71717a]">
                    <code className="text-[#e09415]">primary #f5a623</code> marks every interactive commitment —
                    Add To Cart, Register Now, Shop by Category, cart and favourite count badges, stock bar fill,
                    logo glyph. Hovering any link anywhere on the page turns it amber.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-2 text-[13px] font-semibold text-[#222]">
                    Red is the urgency colour
                  </div>
                  <p className="text-xs leading-5 text-[#71717a]">
                    <code className="text-[#ea5455]">alert #ea5455</code> is reserved exclusively for prices,
                    discount badges, countdowns, promo headlines, and the Deals Today nav link. It never marks an
                    action the user can take.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-2 text-[13px] font-semibold text-[#222]">No section dividers</div>
                  <p className="text-xs leading-5 text-[#71717a]">
                    Bands are separated by surface colour alternation only — white and{" "}
                    <code className="text-[#71717a]">surface-band</code>. The only hairlines on the page are the 1px
                    borders on cards themselves.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-2 text-[13px] font-semibold text-[#222]">Flat by design</div>
                  <p className="text-xs leading-5 text-[#71717a]">
                    Cards at rest have no shadow. Depth exists only on floating hero photography and on hover states.
                    Separation comes from the border plus white-on-canvas contrast.
                  </p>
                </Panel>
              </div>
            </Section>

            <Section
              id="colors"
              title="Colors"
              lead="Two accent hues on neutral greys. That is the whole palette — there is no third hue in the system."
            >
              <div className="mb-6">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Brand &amp; Accent</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {brandAccent.map((item) => (
                    <div key={item.token} className="overflow-hidden rounded-lg border border-[#ebebeb] bg-white">
                      <div className="h-14" style={{ background: item.hex }} />
                      <div className="p-2.5">
                        <code className="block text-[10px] font-semibold text-[#222]">{item.token}</code>
                        <Hex value={item.hex} />
                        <p className="mt-1.5 text-[10px] leading-[1.5] text-[#71717a]">{item.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                { title: "Surface", items: surfaces },
                { title: "Hairline", items: hairlines },
                { title: "Text", items: inks },
                { title: "Functional", items: functional },
              ].map((group) => (
                <div key={group.title} className="mb-6 last:mb-0">
                  <div className="mb-2 text-[12px] font-semibold text-[#222]">{group.title}</div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {group.items.map((item) => (
                      <div key={item.token} className="overflow-hidden rounded-lg border border-[#ebebeb] bg-white">
                        <div className="h-14" style={{ background: item.hex }} />
                        <div className="p-2.5">
                          <code className="block text-[10px] font-semibold text-[#222]">{item.token}</code>
                          <Hex value={item.hex} />
                          <p className="mt-1.5 text-[10px] leading-[1.5] text-[#71717a]">{item.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Hero Gradients</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {heroGradients.map((gradient) => (
                    <div key={gradient.name}>
                      <div
                        className="mb-2 h-24 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.stops[0]} 0%, ${gradient.stops[2]} 100%)`,
                        }}
                      />
                      <div className="text-[12px] font-semibold text-[#222]">{gradient.name}</div>
                      <div className="mt-1 flex gap-1.5">
                        {gradient.stops.map((stop, i) => (
                          <Hex key={stop} value={`${gradient.tokens[i]} ${stop}`} />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] leading-[1.5] text-[#71717a]">{gradient.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              id="typography"
              title="Typography"
              lead="Prompt at 300–700 — a Thai-first humanist sans chosen for legibility at small sizes. Self-hosted via next/font. No separate display face, no mono."
            >
              <Panel>
                {typeScale.map((item) => (
                  <div key={item.token} className="border-b border-[#f0f0f0] py-3 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <code className="text-[10px] font-semibold text-[#e09415]">{item.token}</code>
                      <span className="text-[10px] text-[#999]">
                        {item.size} / {item.weight} / lh {item.lineHeight}
                      </span>
                    </div>
                    <div
                      className="mt-1 text-[#1a1a1a]"
                      style={{ fontSize: item.size, fontWeight: item.weight, lineHeight: item.lineHeight }}
                    >
                      {item.sample}
                    </div>
                    <div className="mt-0.5 text-[10px] text-[#71717a]">{item.use}</div>
                  </div>
                ))}
              </Panel>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Panel>
                  <div className="mb-1 text-[11px] font-semibold text-[#222]">Section titles are 18px</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    Nothing below the hero is larger. If a heading feels small, that is correct.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-1 text-[11px] font-semibold text-[#222]">Prices outrank names</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    Price is alert red at 14px/700. The product name above it is 12px/600 in ink-body.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-1 text-[11px] font-semibold text-[#222]">Uppercase only for eyebrows</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    The brand line above a product name and the tag above a brand caption. Everything else is
                    sentence case.
                  </p>
                </Panel>
              </div>
            </Section>

            <Section
              id="layout"
              title="Layout"
              lead="Base unit 2px. Container maxes at 1200px with 16px inline padding. Section padding never exceeds 24px — banding separates sections, not air."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Panel>
                  <div className="mb-2 text-[12px] font-semibold text-[#222]">Spacing scale</div>
                  <div className="flex flex-wrap items-end gap-4">
                    {spacingScale.map((item) => (
                      <div key={item.token} className="text-center">
                        <div
                          className="rounded-sm bg-primary"
                          style={{ width: item.value, height: item.value }}
                        />
                        <div className="mt-1 text-[10px] text-[#71717a]">{item.token}</div>
                        <div className="text-[9px] text-[#999]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <div className="mb-2 text-[12px] font-semibold text-[#222]">Band alternation</div>
                  <p className="mb-3 text-[10px] leading-[1.5] text-[#71717a]">
                    Adjacent sections alternate white and surface-band with no divider line between them.
                  </p>
                  <div className="flex overflow-hidden rounded-md border border-[#ebebeb]">
                    <div className="h-10 flex-1 bg-white" />
                    <div className="h-10 flex-1 bg-[#f4f5f7]" />
                    <div className="h-10 flex-1 bg-white" />
                    <div className="h-10 flex-1 bg-[#f4f5f7]" />
                  </div>
                </Panel>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Panel>
                  <div className="mb-1 text-[12px] font-semibold text-[#222]">Container</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    1200px max-width, centred, 16px inline padding. Exposed as the{" "}
                    <code className="text-[#e09415]">container-page</code> utility.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-1 text-[12px] font-semibold text-[#222]">Card gaps</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    14px in product grids, 12px in the category tile grid, 16px in the brand grid.
                  </p>
                </Panel>
                <Panel>
                  <div className="mb-1 text-[12px] font-semibold text-[#222]">Carousel geometry</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    Slides carry explicit percentage widths that reproduce the grid&apos;s per-column width at that
                    breakpoint, so a carousel looks identical to a grid when content fits.
                  </p>
                </Panel>
              </div>
            </Section>

            <Section
              id="elevation"
              title="Elevation & Depth"
              lead="Farmart is a flat design. Only floating hero photography and hover states cast shadows."
            >
              <Panel>
                {elevation.map((item) => (
                  <SpecRow
                    key={item.level}
                    token={`Level ${item.level}`}
                    detail={item.use}
                    preview={
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-sm border border-[#ebebeb] bg-white"
                          style={item.level ? { boxShadow: item.shadow } : undefined}
                        />
                        <code className="text-[9px] text-[#999]">{item.level ? item.shadow : "none"}</code>
                      </div>
                    }
                  />
                ))}
              </Panel>
            </Section>

            <Section id="shapes" title="Shapes" lead="Six radius steps. Carousel controls are deliberately square.">
              <Panel>
                {radiusScale.map((item) => (
                  <SpecRow
                    key={item.token}
                    token={`rounded-${item.token} — ${item.value}`}
                    detail={item.use}
                    preview={
                      <div
                        className="h-8 w-8 border-2 border-primary"
                        style={{ borderRadius: item.value === "0px" ? 0 : item.value }}
                      />
                    }
                  />
                ))}
              </Panel>
              <div className="mt-4">
                <Panel>
                  <div className="mb-2 text-[12px] font-semibold text-[#222]">Photography geometry</div>
                  <p className="text-[10px] leading-[1.5] text-[#71717a]">
                    All imagery uses <code className="text-[#e09415]">object-contain</code> inside fixed-height flex
                    boxes and is never cropped. Hero photography is rotated (−6°) and drop-shadowed so it appears to
                    float above the gradient rather than fill a media frame.
                  </p>
                </Panel>
              </div>
            </Section>

            <Section
              id="components"
              title="Components"
              lead="Live specimens rendered from the same classes the storefront uses."
            >
              {/* Buttons */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Buttons</div>
                <Panel>
                  <div className="flex flex-wrap items-center gap-5">
                    <button className="cursor-pointer rounded border-none bg-primary px-5 py-[7px] text-[11px] font-semibold text-white hover:bg-primary-hover">
                      button-primary
                    </button>
                    <button className="cursor-pointer rounded border-none bg-primary-hover px-5 py-[7px] text-[11px] font-semibold text-white">
                      button-primary-hover
                    </button>
                    <button className="cursor-pointer rounded border-none bg-white px-5 py-2 text-[11px] font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
                      button-white
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Previous"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center border border-[#ebebeb] bg-white text-[9px] text-[#555] hover:border-primary hover:text-primary"
                      >
                        <i className="fa-solid fa-chevron-left" />
                      </button>
                      <button
                        aria-label="Next"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center border border-[#ebebeb] bg-white text-[9px] text-[#555] hover:border-primary hover:text-primary"
                      >
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>
                    <div className="flex w-[220px] cursor-pointer items-center justify-between rounded-sm bg-primary py-3 pl-5 pr-5 text-[12px] font-medium text-white">
                      <span className="whitespace-nowrap">
                        <i className="fa-solid fa-bars mr-2" />
                        SHOP BY CATEGORY
                      </span>
                      <i className="fa-solid fa-chevron-down text-xs" />
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] leading-[1.5] text-[#71717a]">
                    <code>button-carousel</code> is a 24×24 square with zero radius. Buttons are 11px/600 by design —
                    do not scale them up.
                  </p>
                </Panel>
              </div>

              {/* Badges */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Badges, pills &amp; chips</div>
                <Panel>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 rounded-sm bg-[#ea5455] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        -20%
                      </span>
                      <div className="relative h-10 w-10 rounded border border-[#ebebeb] bg-white" />
                    </div>
                    <span className="rounded-sm bg-[#ea5455] px-2 py-[3px] text-[11px] text-white">
                      Expires in: 08 : 25 : 37
                    </span>
                    <div className="relative">
                      <i className="fa-solid fa-bag-shopping text-xl" />
                      <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                        5
                      </span>
                    </div>
                    <div className="text-[10px] text-[#ffc107]">
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <span className="ml-1 text-[#999]">(12)</span>
                    </div>
                    <div className="w-32">
                      <div className="mb-1.5 h-[5px] w-full overflow-hidden rounded-[10px] bg-[#eee]">
                        <div className="h-full w-[70%] bg-primary" />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#71717a]">
                        <span>Sold: 28/40</span>
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>

              {/* Inputs */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Inputs &amp; forms</div>
                <Panel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center overflow-hidden rounded border-2 border-primary bg-white">
                      <select className="cursor-pointer border-none border-r border-[#e2e2e2] bg-[#f7f7f7] px-4 py-3 text-[13px] text-[#555] outline-none">
                        <option>All Categories</option>
                      </select>
                      <input
                        placeholder="I'm searching for..."
                        className="flex-1 border-none px-4 py-3 text-[13px] outline-none"
                      />
                      <button className="cursor-pointer border-none bg-transparent px-5 text-[15px] text-[#666]">
                        <i className="fa-solid fa-magnifying-glass" />
                      </button>
                    </div>
                    <div className="relative">
                      <i className="fa-regular fa-envelope absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
                      <input
                        placeholder="yourdetail@gmail.com"
                        className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
                      />
                    </div>
                  </div>
                </Panel>
              </div>

              {/* Cards */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Cards</div>
                <div className="grid gap-4 lg:grid-cols-4">
                  {/* Product */}
                  <div className="relative flex flex-col rounded-md border border-[#ebebeb] bg-white p-3.5">
                    <span className="absolute left-2.5 top-2.5 rounded-sm bg-[#ea5455] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      -20%
                    </span>
                    <div className="mb-3 flex h-[120px] items-center justify-center">
                      <Image
                        src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=200&q=80"
                        alt="Beef mince"
                        width={140}
                        height={140}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="mb-1 text-[10px] text-[#999] uppercase">Meat Brand</span>
                    <div className="clamp-2 mb-2 h-[34px] text-xs font-semibold leading-[1.4] text-[#333]">
                      British Beef Mince (20% Fat)
                    </div>
                    <div className="mb-2 text-[10px] text-[#ffc107]">
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <span className="ml-1 text-[#999]">(08)</span>
                    </div>
                    <div className="mb-2.5 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#ea5455]">$4.75</span>
                      <span className="text-[11px] text-[#aaa] line-through">$5.90</span>
                    </div>
                    <button className="mt-auto w-full cursor-pointer rounded border-none bg-primary py-[7px] text-[11px] font-semibold text-white">
                      Add To Cart
                    </button>
                  </div>

                  {/* Category */}
                  <div className="flex h-full flex-col justify-center rounded-lg border border-[#ebebeb] bg-white px-2 py-4 text-center transition-all hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                    <div className="mb-2.5 flex h-9 items-center justify-center text-[26px] text-primary">
                      <i className="fa-solid fa-apple-whole" />
                    </div>
                    <div className="text-[11px] font-medium leading-[1.3] text-[#333]">
                      <span className="block">Fruits &amp;</span>
                      <span className="block">Vegetables</span>
                    </div>
                  </div>

                  {/* Brand */}
                  <div className="flex flex-col overflow-hidden rounded-lg border border-[#ebebeb] bg-[#f8f9fa]">
                    <div
                      className="flex h-[140px] items-center justify-center p-4"
                      style={{ background: "#eef0f8" }}
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=300&q=80"
                        alt="Snack pack"
                        width={160}
                        height={120}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="border-t border-[#f0f0f0] bg-white p-3">
                      <span className="mb-1 block text-[10px] font-semibold text-[#999] uppercase">FoodPouch</span>
                      <div className="truncate text-xs font-semibold text-[#222]">New Snacks Release</div>
                    </div>
                  </div>

                  {/* Promo */}
                  <div className="flex flex-col justify-center rounded-lg border border-[#ffeed4] bg-[#fff9f0] px-[18px] py-6 text-center">
                    <h3 className="mb-1 text-2xl font-bold text-[#ea5455]">15% OFF</h3>
                    <p className="mb-[18px] text-[11px] text-[#666]">
                      For new member sign up at the first time
                    </p>
                    <div className="relative mb-2.5">
                      <i className="fa-regular fa-envelope absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
                      <input
                        placeholder="yourdetail@gmail.com"
                        className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
                      />
                    </div>
                    <div className="relative mb-2.5">
                      <i className="fa-solid fa-lock absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
                      <input
                        placeholder="Set Your Password"
                        className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
                      />
                    </div>
                    <button className="mt-1 cursor-pointer rounded border-none bg-primary py-2.5 text-xs font-semibold text-white">
                      Register Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Product detail */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Product detail</div>
                <ProductSpecimens />
              </div>

              {/* Dialog */}
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Dialog</div>
                <DialogSpecimens />
              </div>

              {/* Hero banners */}
              <div>
                <div className="mb-2 text-[12px] font-semibold text-[#222]">Hero banners</div>
                <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                  <div className="relative flex min-h-[200px] items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#eef3fb] via-[#dde7f5] to-[#c9d9ee] p-10">
                    <div className="z-[2] max-w-[50%]">
                      <h2 className="mb-3 text-[28px] leading-[1.25] font-bold text-[#1a1a1a]">
                        Active Summer With Juice Milk 300ml
                      </h2>
                      <p className="mb-6 text-xs text-[#5b6b85]">
                        New arrivals with natural fruits, juice packs, essential for summer.
                      </p>
                      <button className="rounded bg-white px-5 py-2 text-[11px] font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
                        Shop Now
                      </button>
                    </div>
                    <div className="absolute bottom-2.5 right-10 flex h-[160px] w-[160px] items-center justify-center">
                      <Image
                        src="https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80"
                        alt="Juice bottle"
                        width={160}
                        height={160}
                        className="max-h-full max-w-full object-contain -rotate-6 drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)]"
                      />
                    </div>
                  </div>
                  <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-[#fef4e3] via-[#fde5bd] to-[#fbd597] p-[30px]">
                    <div>
                      <div className="mb-1.5 text-[22px] font-bold text-[#ea5455]">20% SALE OFF</div>
                      <p className="mb-4 text-xs text-[#8a6a35]">
                        Synthetic seeds
                        <br />
                        Net 2.0 OZ
                      </p>
                      <button className="rounded bg-white px-5 py-2 text-[11px] font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
                        Shop Now
                      </button>
                    </div>
                    <Image
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                      alt="Food box"
                      width={140}
                      height={140}
                      className="absolute -bottom-2.5 -right-2.5 w-[140px] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)]"
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section
              id="guidelines"
              title="Do's and Don'ts"
              lead="Guardrails for keeping generated UI consistent with the storefront."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#222]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">
                      ✓
                    </span>
                    Do
                  </div>
                  <ul className="list-none">
                    {dos.map((item) => (
                      <li key={item} className="flex gap-2 border-b border-[#f0f0f0] py-2 text-[11px] leading-[1.6] text-[#333] last:border-b-0">
                        <i className="fa-solid fa-check mt-[3px] text-[9px] text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel>
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#222]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ea5455] text-[11px] text-white">
                      ✕
                    </span>
                    Don&apos;t
                  </div>
                  <ul className="list-none">
                    {donts.map((item) => (
                      <li key={item} className="flex gap-2 border-b border-[#f0f0f0] py-2 text-[11px] leading-[1.6] text-[#333] last:border-b-0">
                        <i className="fa-solid fa-xmark mt-[3px] text-[9px] text-[#ea5455]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </Section>

            <Section
              id="responsive"
              title="Responsive Behavior"
              lead="Grids collapse 8→4→2, 4→2, 6→3→2. Carousel slides track the same stair so a carousel and a grid look identical at every width."
            >
              <Panel>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {breakpoints.map((bp) => (
                    <div key={bp.name} className="rounded-md border border-[#ebebeb] p-3">
                      <div className="text-[12px] font-semibold text-[#222]">{bp.name}</div>
                      <div className="mb-1.5 text-[10px] font-semibold text-[#e09415]">{bp.width}</div>
                      <p className="text-[10px] leading-[1.5] text-[#71717a]">{bp.changes}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-[#f0f0f0] pt-3 text-[11px] leading-[1.6] text-[#71717a]">
                  <strong className="text-[#222]">Touch targets:</strong> carousel controls are 24×24 and hidden below{" "}
                  <code className="text-[#e09415]">md</code> rather than being enlarged — touch users swipe the track
                  instead. The search bar and category tab stay ≥ 44px tall. Hero photography is hidden below{" "}
                  <code className="text-[#e09415]">md</code> rather than shrunk, letting the text block take the full
                  banner width.
                </p>
              </Panel>
            </Section>
          </div>
        </Spec>
      </main>

      <footer className="bg-white">
        <div className="container-page py-8 text-[11px] text-[#71717a]">
          Tokens rendered from <code className="font-semibold text-[#222]">DESIGN.md</code> at the project root. Source
          of truth is the YAML frontmatter; <code className="font-semibold text-[#222]">src/lib/design-tokens.ts</code>{" "}
          mirrors it for this catalog.
        </div>
      </footer>
    </>
  );
}