/**
 * Mirror of the token block in DESIGN.md (YAML frontmatter).
 * Keep both in sync — DESIGN.md is the source of truth for agents,
 * this file is what the /design catalog renders.
 */

export type Swatch = {
  token: string;
  hex: string;
  role: string;
};

export const brandAccent: Swatch[] = [
  { token: "primary", hex: "#f5a623", role: "Brand. Logo glyph, Shop by Category, Add To Cart, Register Now, stock bar fill, count badges" },
  { token: "primary-hover", hex: "#e09415", role: "Amber button hover. The only sanctioned darker amber" },
  { token: "on-primary", hex: "#ffffff", role: "Text and icons on any amber fill. Buttons, badges, the stock bar" },
  { token: "alert", hex: "#ea5455", role: "Urgency. Price, discount badge, countdown pill, promo headline, Deals Today link" },
  { token: "alert-deep", hex: "#d97706", role: "Sale headline on warm surfaces where red would collide with the gradient" },
];

export const surfaces: Swatch[] = [
  { token: "canvas", hex: "#fbfbfb", role: "Page background. Off-white so white cards separate from it" },
  { token: "surface", hex: "#ffffff", role: "Every card, both header rows, nav bar" },
  { token: "surface-band", hex: "#f4f5f7", role: "Alternating section background. Hero and best-seller bands" },
  { token: "surface-tint", hex: "#fff8eb", role: "Warm amber-tinted promotional surface" },
  { token: "surface-promo", hex: "#fff9f0", role: "The 15% OFF signup panel" },
  { token: "surface-select", hex: "#f7f7f7", role: "Category select inside the search bar. The only grey control" },
];

export const hairlines: Swatch[] = [
  { token: "hairline", hex: "#ebebeb", role: "Default 1px card border" },
  { token: "hairline-soft", hex: "#f0f0f0", role: "Divider between brand card image and caption" },
  { token: "hairline-input", hex: "#dddddd", role: "Signup form field borders" },
  { token: "hairline-select", hex: "#e2e2e2", role: "Vertical rule splitting search select from input" },
  { token: "hairline-promo", hex: "#ffeed4", role: "Border of the 15% OFF signup panel" },
];

export const inks: Swatch[] = [
  { token: "ink", hex: "#1a1a1a", role: "Headings and section titles" },
  { token: "ink-body", hex: "#333333", role: "Product names, nav links" },
  { token: "ink-strong", hex: "#222222", role: "Logo wordmark, white button labels" },
  { token: "ink-deep", hex: "#111111", role: "Hotline number" },
  { token: "ink-muted", hex: "#71717a", role: "Secondary copy, All Categories link" },
  { token: "ink-faint", hex: "#999999", role: "Brand eyebrow, secondary icons" },
  { token: "ink-ghost", hex: "#aaaaaa", role: "Struck-through original price" },
];

export const functional: Swatch[] = [
  { token: "star", hex: "#ffc107", role: "Product rating stars only" },
  { token: "track-empty", hex: "#eeeeee", role: "Unfilled portion of the stock progress bar" },
  { token: "hero-cool-text", hex: "#5b6b85", role: "Supporting copy on the cool hero gradient" },
  { token: "hero-warm-text", hex: "#8a6a35", role: "Supporting copy on the warm hero gradient" },
];

export const heroGradients = [
  {
    name: "Hero Cool",
    tokens: ["hero-cool-1", "hero-cool-2", "hero-cool-3"],
    stops: ["#eef3fb", "#dde7f5", "#c9d9ee"],
    role: "Large hero banner. 135°, must stay clearly darker than surface-band",
  },
  {
    name: "Hero Warm",
    tokens: ["hero-warm-1", "hero-warm-2", "hero-warm-3"],
    stops: ["#fef4e3", "#fde5bd", "#fbd597"],
    role: "Narrow promo banner. 135°",
  },
];

export type TypeToken = {
  token: string;
  size: string;
  weight: number;
  lineHeight: string;
  sample: string;
  use: string;
};

export const typeScale: TypeToken[] = [
  { token: "display-lg", size: "28px", weight: 700, lineHeight: "1.25", sample: "Active Summer", use: "Hero banner headline" },
  { token: "display-md", size: "24px", weight: 700, lineHeight: "1.25", sample: "15% OFF", use: "Logo wordmark, promo headline" },
  { token: "display-sm", size: "22px", weight: 700, lineHeight: "1.25", sample: "20% SALE OFF", use: "Sale headline" },
  { token: "heading-lg", size: "18px", weight: 700, lineHeight: "1.5", sample: "Best Seller", use: "Section titles" },
  { token: "heading-md", size: "15px", weight: 700, lineHeight: "1.5", sample: "8 800 332 65-66", use: "Hotline, cart total" },
  { token: "body", size: "14px", weight: 400, lineHeight: "1.5", sample: "New arrivals with natural fruits", use: "Page default, prices at 700" },
  { token: "body-small", size: "12px", weight: 400, lineHeight: "1.5", sample: "Ice Best Cream 350ml x 24", use: "Product names, hero copy, All Categories link" },
  { token: "label", size: "12px", weight: 500, lineHeight: "1.5", sample: "Fruits & Vegetables", use: "Nav links, category tile names" },
  { token: "label-tight", size: "11px", weight: 600, lineHeight: "1.5", sample: "Add To Cart", use: "Buttons" },
  { token: "micro", size: "10px", weight: 400, lineHeight: "1.5", sample: "Sold: 28/40", use: "Stock, review counts, form fields, old prices" },
  { token: "eyebrow", size: "10px", weight: 600, lineHeight: "1.5", sample: "BRAND NAME", use: "Uppercase brand eyebrow on cards" },
];

export const radiusScale = [
  { token: "none", value: "0px", use: "Carousel controls, nav tab top edge" },
  { token: "xs", value: "2px", use: "Discount badge, countdown pill" },
  { token: "sm", value: "4px", use: "All buttons, search bar, form inputs, nav tab" },
  { token: "md", value: "6px", use: "Product cards" },
  { token: "lg", value: "8px", use: "Hero banners, category tiles, brand cards, promo panel" },
  { token: "full", value: "9999px", use: "Count badges, stock bar, rating stars" },
];

export const spacingScale = [
  { token: "xs", value: "4px" },
  { token: "sm", value: "6px" },
  { token: "md", value: "8px" },
  { token: "lg", value: "12px" },
  { token: "xl", value: "14px" },
  { token: "xxl", value: "16px" },
  { token: "huge", value: "20px" },
  { token: "giant", value: "24px" },
];

export const elevation = [
  { level: 0, shadow: "none", use: "Default card, header, nav bar, all sections" },
  { level: 1, shadow: "0 2px 6px rgba(0,0,0,0.06)", use: "Hero Shop Now buttons only" },
  { level: 2, shadow: "0 4px 12px rgba(0,0,0,0.06)", use: "Card hover state, category tile hover" },
  { level: 3, shadow: "0 10px 15px rgba(0,0,0,0.1)", use: "Promo banner photo only" },
  { level: 4, shadow: "0 15px 20px rgba(0,0,0,0.15)", use: "Large hero photo only" },
  { level: 5, shadow: "0 20px 40px rgba(0,0,0,0.18)", use: "Dialog panel only — the single floating surface" },
];

export const breakpoints = [
  { name: "Wide", width: "≥ 1280px", changes: "Full 1200px container, header gap-14, nav menu visible" },
  { name: "Desktop", width: "1024–1279px", changes: "Best sellers 6-up, top saver 4-up, brands 4-up, hero 2fr/1fr" },
  { name: "Tablet", width: "768–1023px", changes: "Categories 4-up, brands 2-up, top saver 3-up, best sellers 3-up" },
  { name: "Mobile", width: "< 768px", changes: "Hero stacks and photos hide, categories 2-up, products 2-up, controls hidden" },
];

export const dos = [
  "Keep amber for interactive commitments and red for urgency — prices, discounts, countdowns, promo headlines.",
  "Alternate surface and surface-band between adjacent sections instead of drawing divider lines.",
  "Clamp product names to exactly two lines at a fixed height so cards stay aligned.",
  "Pin Add To Cart with mt-auto so every card in a row bottoms out at the same line.",
  "Keep hero gradients clearly darker than surface-band so the banners read as separate objects.",
  "Use percentage widths on carousel slides to reproduce the equivalent grid column width.",
];

export const donts = [
  "Don't add a border or shadow between page sections — there are none.",
  "Don't put a drop shadow on any card at rest; cards are flat with a 1px border.",
  "Don't use primary for prices or discounts, and don't use alert for buttons.",
  "Don't let a product name exceed two lines, and don't let a card's CTA float mid-card.",
  "Don't add a second accent hue; the palette is amber + red on neutral greys.",
  "Don't scale button or card type above 14px; density is the design.",
  "Don't round the carousel controls — they are deliberately square.",
];