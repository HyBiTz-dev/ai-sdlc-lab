---
version: alpha
name: Farmart-design-analysis
description: Farmart is a dense, discount-led grocery storefront — a warm amber accent on a near-white canvas, small type everywhere, and a heavy reliance on bordered white cards floating on subtly banded backgrounds. The homepage reads as a stacked sequence of horizontal shelves: hero banners, category tiles, brand promos, a time-boxed deal row with a signup panel, and a best-seller grid. Density beats whitespace almost everywhere; the only breathing room is inside the hero banners. Every price, badge, and countdown is the loudest thing in its card, and the Thai-first type stack carries most of the interface.

colors:
  primary: "#f5a623"
  primary-hover: "#e09415"
  on-primary: "#ffffff"
  alert: "#ea5455"
  alert-deep: "#d97706"
  canvas: "#fbfbfb"
  surface: "#ffffff"
  surface-band: "#f4f5f7"
  surface-tint: "#fff8eb"
  surface-promo: "#fff9f0"
  surface-select: "#f7f7f7"
  ink: "#1a1a1a"
  ink-body: "#333333"
  ink-strong: "#222222"
  ink-deep: "#111111"
  ink-muted: "#71717a"
  ink-faint: "#999999"
  ink-ghost: "#aaaaaa"
  hairline: "#ebebeb"
  hairline-soft: "#f0f0f0"
  hairline-input: "#dddddd"
  hairline-select: "#e2e2e2"
  hairline-promo: "#ffeed4"
  star: "#ffc107"
  track-empty: "#eeeeee"
  hero-cool-1: "#eef3fb"
  hero-cool-2: "#dde7f5"
  hero-cool-3: "#c9d9ee"
  hero-cool-text: "#5b6b85"
  hero-warm-1: "#fef4e3"
  hero-warm-2: "#fde5bd"
  hero-warm-3: "#fbd597"
  hero-warm-text: "#8a6a35"

typography:
  display-lg:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  display-md:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  display-sm:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  heading-lg:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0
  heading-md:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0
  body:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-small:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  label-tight:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  micro:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  eyebrow:
    fontFamily: "Prompt, ui-sans-serif, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0.5px

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px

spacing:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 14px
  xxl: 16px
  huge: 20px
  giant: 24px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.sm}"
    padding: 7px 0
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.sm}"
    padding: 7px 0
  button-white:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.sm}"
    padding: 8px 20px
  button-carousel:
    backgroundColor: "{colors.surface}"
    textColor: "#555555"
    typography: "{typography.micro}"
    rounded: "{rounded.none}"
    padding: 0px
  button-carousel-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.none}"
    padding: 0px
  nav-category:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
  card-product:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: 14px
  card-category:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 16px 8px
  card-brand:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.lg}"
    padding: 12px
  card-promo:
    backgroundColor: "{colors.surface-promo}"
    textColor: "#666666"
    typography: "{typography.body-small}"
    rounded: "{rounded.lg}"
    padding: 24px 18px
  hero-banner-cool:
    backgroundColor: "linear-gradient(135deg, {colors.hero-cool-1} 0%, {colors.hero-cool-3} 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.lg}"
    padding: 40px
  hero-banner-warm:
    backgroundColor: "linear-gradient(135deg, {colors.hero-warm-1} 0%, {colors.hero-warm-3} 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 30px
  badge-discount:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.on-primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  badge-count:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: 0px 4px
  badge-countdown:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-small}"
    rounded: "{rounded.xs}"
    padding: 3px 8px
  pill-star:
    backgroundColor: "{colors.star}"
    textColor: "{colors.on-primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: 0px
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
  input-select:
    backgroundColor: "{colors.surface-select}"
    textColor: "#555555"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: 12px 16px
  input-form:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.sm}"
    padding: 9px 12px 9px 32px
  header-main:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 24px 16px
  nav-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: 12px 16px
  section-band:
    backgroundColor: "{colors.surface-band}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 24px 16px
  dialog-overlay:
    backgroundColor: "rgba(17, 17, 17, 0.45)"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: 0px
  dialog-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body-small}"
    rounded: "{rounded.lg}"
    padding: 24px
  dialog-title:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.none}"
    padding: 0px
  dialog-body:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: 0px
  dialog-footer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.none}"
    padding: 16px 0 0
  dialog-close:
    backgroundColor: "{colors.surface}"
    textColor: "#555555"
    typography: "{typography.micro}"
    rounded: "{rounded.none}"
    padding: 0px
  dialog-close-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.none}"
    padding: 0px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.sm}"
    padding: 8px 20px
  breadcrumb:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: 12px 0px
  card-detail:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: 20px
  gallery-frame:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.micro}"
    rounded: "{rounded.md}"
    padding: 24px
  thumb-gallery:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.hairline}"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    padding: 4px
  stepper-quantity:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.label-tight}"
    rounded: "{rounded.sm}"
    padding: 9px 0px
  tab-detail:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: 14px
---

## Overview

Farmart is a discount grocery storefront built around horizontal shelves. The homepage is a vertical stack of sections, each one a full-width band containing a centered 1200px container, and each band alternates between `{colors.surface}` and `{colors.surface-band}` to create a light rhythm without any visible divider — there are **no borders between page sections**. The only hairlines in the entire system are the 1px borders on cards themselves.

The visual weight sits almost entirely on the white card. Cards are flat white, hairline-bordered, and hold small dense content: an uppercase brand eyebrow, a two-line product name, a star rating, a red price, and a full-width amber button. Section headings are modest 18px bold with a 12px grey "All Categories ›" link sitting on the same baseline.

Two visual systems overlap and must not be confused:

1. **Amber (`{colors.primary}`) is the brand and the action colour.** It marks every interactive commitment — Add To Cart, Register Now, Shop by Category, the cart/favourite count badges, the stock progress fill, and the logo glyph. Hovering any link anywhere on the page turns it amber.
2. **Red (`{colors.alert}`) is the urgency colour.** It is reserved exclusively for prices, discount badges, countdowns, and the promo headline. It never marks an action the user can take.

The hero is the only place with real breathing room: two gradient banners at 280px minimum height, each with a rotated, drop-shadowed product photo. Everything below the hero is compressed and repetitive by design.

**Key Characteristics:**
- **No section dividers.** Bands are separated by surface colour alternation only.
- **Two-colour accent discipline** — amber = interactive, red = urgency. Never swap them.
- **Extreme type density.** Base body is 14px; supporting copy drops to 11px and 10px. Nothing in a card exceeds 14px except prices.
- **Prices are the loudest text in every card**, not the product name.
- **Product photography floats** — `object-contain`, rotated, drop-shadowed, sitting on card whitespace rather than filling a media frame.
- **Horizontal carousels are the default section shape**, with controls pinned to the right end of the section header row.

## Colors

### Brand & Accent
- **Amber** (`{colors.primary}` — `#f5a623`): The single brand colour. Logo glyph, Shop By Category tab, Add To Cart, Register Now, carousel hover, stock bar fill, count badges.
- **Amber Hover** (`{colors.primary-hover}` — `#e09415`): Pressed/hover state for amber buttons. The only sanctioned darker amber.
- **Alert Red** (`{colors.alert}` — `#ea5455`): Current price, `-20%` discount badge, countdown pill, promo headline, highlighted nav link (Deals Today).
- **Deep Amber** (`{colors.alert-deep}` — `#d97706`): Reserved for sale headlines on warm surfaces where red would collide with the gradient.

### Surface
- **Canvas** (`{colors.canvas}` — `#fbfbfb`): Page background. Deliberately off-white so white cards separate from it.
- **Surface** (`{colors.surface}` — `#ffffff`): Every card, both header rows, and the nav bar.
- **Surface Band** (`{colors.surface-band}` — `#f4f5f7`): Alternating section background. Used on the hero and best-seller bands.
- **Surface Tint** (`{colors.surface-tint}` — `#fff8eb`): Warm amber-tinted surface, reserved for promotional surfaces.
- **Surface Promo** (`{colors.surface-promo}` — `#fff9f0`): The 15% OFF signup panel.
- **Surface Select** (`{colors.surface-select}` — `#f7f7f7`): The category `<select>` inside the search bar — the only grey control.

### Hairline
- **Hairline** (`{colors.hairline}` — `#ebebeb`): Default 1px card border.
- **Hairline Soft** (`{colors.hairline-soft}` — `#f0f0f0`): Divider between a brand card's image area and its caption strip.
- **Hairline Input** (`{colors.hairline-input}` — `#dddddd`): Signup form field borders.
- **Hairline Select** (`{colors.hairline-select}` — `#e2e2e2`): Vertical rule separating the search select from the search input.
- **Hairline Promo** (`{colors.hairline-promo}` — `#ffeed4`): Border of the 15% OFF signup panel.

### Text
- **Ink** (`{colors.ink}` — `#1a1a1a`): Headings and section titles.
- **Ink Body** (`{colors.ink-body}` — `#333333`): Product names, nav links.
- **Ink Strong** (`{colors.ink-strong}` — `#222222`): Logo wordmark, white button labels.
- **Ink Deep** (`{colors.ink-deep}` — `#111111`): Hotline number.
- **Ink Muted** (`{colors.ink-muted}` — `#71717a`): Secondary copy, "All Categories ›" links.
- **Ink Faint** (`{colors.ink-faint}` — `#999999`): Brand eyebrow, secondary icons.
- **Ink Ghost** (`{colors.ink-ghost}` — `#aaaaaa`): Struck-through original price.

### Hero Gradients
- **Hero Cool** (`{colors.hero-cool-1}` `#eef3fb` → `{colors.hero-cool-2}` `#dde7f5` → `{colors.hero-cool-3}` `#c9d9ee`): The large hero banner. Supporting copy uses `{colors.hero-cool-text}` (`#5b6b85`).
- **Hero Warm** (`{colors.hero-warm-1}` `#fef4e3` → `{colors.hero-warm-2}` `#fde5bd` → `{colors.hero-warm-3}` `#fbd597`): The narrow promo banner. Supporting copy uses `{colors.hero-warm-text}` (`#8a6a35`).

Both gradients run 135° (top-left to bottom-right) and both must stay clearly distinct from `{colors.surface-band}` — that is what separates the banners from the band behind them.

### Functional
- **Star** (`{colors.star}` — `#ffc107`): Product rating stars only.
- **Track Empty** (`{colors.track-empty}` — `#eeeeee`): Unfilled portion of the stock progress bar.

## Typography

### Font Family

**Prompt** at 300–700 — a Thai-first humanist sans designed for legibility at small sizes, which is exactly what this density requires. Self-hosted via `next/font/google` (no external requests, no layout shift). Weights used: 400 (body), 500 (labels), 600 (buttons, eyebrows), 700 (all headings).

There is no separate display face and no mono. English text inherits Prompt as-is; do not swap in a Latin-first font, which would break the rhythm between Thai and Latin glyphs.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-lg}` | 28px | 700 | 1.25 | Hero banner headline |
| `{typography.display-md}` | 24px | 700 | 1.25 | Logo wordmark, 15% OFF promo headline |
| `{typography.display-sm}` | 22px | 700 | 1.25 | 20% SALE OFF headline |
| `{typography.heading-lg}` | 18px | 700 | 1.5 | Section titles ("Best Seller") |
| `{typography.heading-md}` | 15px | 700 | 1.5 | Hotline number, cart total |
| `{typography.body}` | 14px | 400 | 1.5 | Page default, product brand eyebrow, prices at 14px/700 |
| `{typography.body-small}` | 12px | 400 | 1.5 | Product names, hero copy, "All Categories ›" link, countdown pill |
| `{typography.label}` | 12px | 500 | 1.5 | Nav links, category tile names |
| `{typography.label-tight}` | 11px | 600 | 1.5 | Add To Cart, Register Now, Shop Now |
| `{typography.micro}` | 10px | 400 | 1.5 | Stock counts, rating counts, form fields, old prices, discount badges |
| `{typography.eyebrow}` | 10px | 600 | 1.5 | Uppercase brand/category eyebrows on product cards |

### Principles
- **Section titles are 18px, nothing larger below the hero.** If a section heading feels small, that is correct.
- **Product names are 12px/600 and clamped to exactly two lines** (`clamp-2`) at a fixed 34px box height. Never let a product name grow a third line.
- **Prices outrank names.** Price is `{colors.alert}` at 14px/700; the name above it is 12px/600 in `{colors.ink-body}`.
- **Uppercase only for eyebrows** — the brand line above a product name and the tag above a brand caption. Everything else is sentence case.
- **Buttons are 11px/600.** Small type on buttons is intentional; do not scale up.

## Layout

### Spacing System
- **Base unit**: 2px, with the working scale at 4 / 6 / 8 / 12 / 14 / 16 / 20 / 24.
- **Container**: `max-width: 1200px`, `padding-inline: 16px`, centred. Exposed as the `container-page` utility.
- **Section padding**: 24px vertical on content bands, 20px on tighter bands. Hero is 24px.
- **Card gap**: 14px in product grids, 12px in the category tile grid, 16px in the brand grid.
- **Header gaps**: the main header row uses 40–56px between logo, search, and actions on `md`+; the search bar itself is capped at 520px and the right-hand action cluster is pushed with `ml-auto`.

### Grid & Container
- Hero splits `2fr 1fr` (large banner / promo banner).
- Top Saver splits `3fr 1fr` (product carousel / signup panel), aligned top with `items-start` so the signup panel's top edge meets the section title, then stretched with `self-stretch`.
- Category tiles: 8 → 4 → 2 columns.
- Brand cards: 4 → 2 columns.
- Best-seller products: 6 → 3 → 2 columns.
- Top-saver products: 4 → 3 → 2 columns.

### Whitespace Philosophy
Whitespace is spent almost entirely inside cards and the hero. Card padding is tight (8–18px) and gaps are 12–16px. The hero is the single exception, using 40px padding and a 280px minimum height. Section-level padding never exceeds 24px — banding is what separates sections, not air.

### Carousel Geometry
Horizontal carousels replace grids. Each slide has an explicit percentage width that reproduces the grid's per-column width at that breakpoint (e.g. `w-[calc((100%-42px)/4)]`), so the carousel looks identical to a grid when content fits. Scrollbars are hidden; snapping is `snap-x snap-mandatory`.

## Elevation & Depth

Farmart is a **flat** design. Depth is almost entirely absent by intent.

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat, no shadow | Default card, header, nav bar, all sections |
| 1 | `0 2px 6px rgba(0,0,0,0.06)` | Hero "Shop Now" white buttons only |
| 2 | `0 4px 12px rgba(0,0,0,0.06)` | Card hover state, category tile hover |
| 3 | `0 10px 15px rgba(0,0,0,0.1)` | Promo banner photo only |
| 4 | `0 15px 20px rgba(0,0,0,0.15)` | Large hero photo only |
| 5 | `0 20px 40px rgba(0,0,0,0.18)` | Dialog panel only — the single floating surface in the system |

### Decorative Depth
The only shadows on the page belong to floating product photography in the hero, and to hover states. Cards at rest have **no shadow** — separation comes from the 1px `{colors.hairline}` border plus the contrast between white and `{colors.canvas}`. The one exception is the dialog panel, which is a floating surface by definition and takes Level 5.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Carousel control buttons, hero banner top edge on the nav tab |
| `{rounded.xs}` | 2px | Discount badge, countdown pill |
| `{rounded.sm}` | 4px | All buttons, search bar, form inputs, Shop by Category tab |
| `{rounded.md}` | 6px | Product cards |
| `{rounded.lg}` | 8px | Hero banners, category tiles, brand cards, promo panel |
| `{rounded.full}` | 9999px | Count badges on cart/favourite icons, stock bar, rating stars |

### Photography Geometry
Product and brand imagery uses `object-contain` with `max-height: 100%` inside a fixed-height flex box — photos never crop and never fill their card edge-to-edge. Hero photography is rotated (`-6deg` on the large banner) and drop-shadowed so it appears to float above the gradient.

## Components

### Buttons

**`button-primary`** — the dominant action across the system (Add To Cart, Register Now).
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.label-tight}`, rounded `{rounded.sm}` 4px, padding 7px vertical, full card width.
- Hover `button-primary-hover`: background `{colors.primary-hover}`.

**`button-secondary`** — the dismissing action in a dialog footer (Cancel, Not Now).
- Background `{colors.surface}`, 1px `{colors.hairline}` border, text `{colors.ink-strong}`, type `{typography.label-tight}`, rounded `{rounded.sm}`, padding 8px 20px. Flat at rest — the hover tint is `{colors.surface-select}`.

**`button-white`** — the hero CTA (Shop Now).
- Background `{colors.surface}`, text `{colors.ink-strong}`, type `{typography.label-tight}`, rounded `{rounded.sm}`, padding 8px 20px, Level 1 shadow.

**`button-carousel`** — prev/next control.
- 24×24px square, **zero radius**, background `{colors.surface}`, 1px `{colors.hairline}` border, 9px chevron in `#555555`, padding 0.
- Hover `button-carousel-hover`: border and icon both shift to `{colors.primary}`.

**`nav-category`** — the "SHOP BY CATEGORY" tab.
- Background `{colors.primary}`, white text, rounded top corners only, fixed 220px width, chevron on the right.

### Cards & Containers

**`card-product`** — the workhorse card.
- White, 1px `{colors.hairline}`, rounded `{rounded.md}` 6px, padding 14px. Contains, top to bottom: discount badge (absolute, top-left), photo box (120px, or 100px in the best-seller row), uppercase brand eyebrow, two-line clamped 12px name, optional star rating, price row, optional stock track, and an `mt-auto` Add To Cart button that pins to the card bottom. Equal-height cards are required — the card is a flex column and the button uses `mt-auto`.

**`card-category`** — an 8-up tile: 26px amber icon in a 36px box, 11px name below, centred, padding 16px 8px. Hover lifts the border to `{colors.primary}` and adds Level 2.

**`card-brand`** — image area with a per-brand tinted background (`#eef0f8`, `#f9f4ec`, `#eaf2f8`, `#eef7ee`), then a caption strip separated by `{colors.hairline-soft}` with an uppercase tag and a truncated title.

**`card-promo`** — the 15% OFF signup panel. `{colors.surface-promo}` fill, `{colors.hairline-promo}` border, `{colors.display-md}` red headline, two icon-prefixed form fields, one full-width amber button. Vertically centred in its column and stretched to the full row height.

### Inputs & Forms

**`input-search`** — the main search field. 2px `{colors.primary}` border on the whole search bar, `{colors.input-select}` select on the left split by `{colors.hairline-select}`, 12px/16px padding.

**`input-form`** — signup fields. 1px `{colors.hairline-input}` border, 32px left padding to clear a leading envelope or lock icon at 10px from the left edge, 11px type.

**`stepper-quantity`** — the only control in the system that edits a number. Built on `input-form` geometry: 1px `{colors.hairline-input}` border, `{rounded.sm}`, 36px tall, with square 36px `−` / `+` step buttons on the flanks and an `input-form`-width count in the middle at `{typography.label-tight}`.
- Step buttons are `{colors.surface}` with a `{colors.hairline-input}` divider; hover tints to `{colors.surface-select}` and the icon to `{colors.primary}`.
- Disabled steps drop to `{colors.ink-ghost}` at the clamped bound rather than hiding.

**`tab-detail`** — the product detail copy panel. `{colors.surface}` card, 1px `{colors.hairline}`, `{rounded.md}`, 14px padding, with a `{colors.hairline-soft}` rule under the tab row.
- Tabs are `{typography.label-tight}` in `{colors.ink-muted}`; the active tab takes a 2px `{colors.primary}` underline and `{colors.ink-strong}` label — the same treatment as the Best Seller filter row.
- The body is `{colors.ink-muted}` at `{typography.body-small}`, with spec rows separated by `{colors.hairline-soft}`.

### Product Detail

**`card-detail`** — the right-hand column of the detail page: `{colors.surface}`, 1px `{colors.hairline}`, `{rounded.md}`, 20px padding. Order top to bottom: uppercase brand eyebrow, 18px product name, stars + verified review count, the price row, stock track, a hairline-soft trust row, then the buy panel.

**`gallery-frame`** — the photo block: `{colors.surface}`, 1px `{colors.hairline}`, `{rounded.md}`, 24px padding, minimum 360px tall. The photo stays `object-contain` with an explicit max-height so it floats on the card rather than filling it. `badge-discount` pins to the top-left corner.

**`thumb-gallery`** — a 64×64 square thumbnail rail under the frame. `{colors.surface}` fill, 1px `{colors.hairline}`, `{rounded.sm}`, 4px padding; the selected thumb's border shifts to `{colors.primary}`, hover does the same. Thumbnails are never rounded past `{rounded.sm}` — this is not a carousel, so it takes no chevron controls.

**`breadcrumb`** — `{typography.body-small}` in `{colors.ink-muted}` with 8px `{colors.ink-ghost}` chevrons. The current page is `{colors.ink-body}` and is never a link. It sits directly under the nav bar on a `{colors.surface}` band, 12px vertical padding, no bottom rule.

### Overlays

**`dialog-overlay`** — the scrim behind every dialog.
- `rgba(17, 17, 17, 0.45)` flat fill, no blur, no gradient. Fixed and centred via the native top layer so it escapes any `overflow` ancestor.
- Clicking the scrim closes the dialog. `Esc` closes it as well.

**`dialog-panel`** — the dialog surface itself.
- `{colors.surface}` fill, 1px `{colors.hairline}` border, `{rounded.lg}` 8px, padding 24px, width `min(480px, 100vw - 32px)`, max-height `85vh` with the body scrolling.
- The only Level 5 shadow on the site — a floating surface is the one place the flat system is allowed to lift.

**`dialog-title`** — `{typography.heading-lg}` 18px/700 in `{colors.ink}`, with a `{dialog-close}` control on the right.
**`dialog-close`** — reuses the carousel control geometry: 24×24, **zero radius**, 1px `{colors.hairline}` border, micro icon in `#555555`. Hover shifts border and icon to `{colors.primary}`.

**`dialog-body`** — `{typography.body-small}` 12px/400 in `{colors.ink-muted}`. Rows inside the body reuse the card conventions: 12px name, `{colors.alert}` price, `input-form` fields.

**`dialog-footer`** — actions pinned to the bottom, separated from the body by a `{colors.hairline-soft}` rule and 16px of space, right-aligned, 8px gap.
- Primary action is `button-primary`; the dismissing action is `button-secondary` (white, 1px `{colors.hairline}` border, `{colors.ink-strong}` label).
- Never `{colors.alert}` — red does not mark actions.

### Navigation

**`header-main`** — two-row header, white, no border between it and the nav below. Top row: logo, search bar (capped 520px), hotline, then a right-aligned cluster of user / favourite / cart actions with absolute count badges. Bottom row (`nav-bar`): category tab plus a horizontal menu with caret dropdowns and a "Recently Viewed" affordance at the far right. The nav menu hides below `lg`; the hotline hides below `sm`.

### Pills, Tags, and Chips

**`badge-discount`** — absolute top-left on product cards, `{colors.alert}` fill, 10px text.
**`badge-countdown`** — sits inline with the "Top Saver Today" title, `{colors.alert}` fill.
**`badge-count`** — circular, `{colors.primary}` fill, absolutely positioned at the top-right corner of the cart and favourite icons.
**`pill-star`** — inline 10px stars in `{colors.star}`, with a grey review count in parentheses.
**Stock track** — 5px full-width bar, `{colors.track-empty}` fill, amber progress fill, with a 10px "Sold: 28/40" caption below.

## Do's and Don'ts

### Do
- Keep amber for interactive commitments and red for urgency — prices, discounts, countdowns, promo headlines.
- Alternate `{colors.surface}` and `{colors.surface-band}` between adjacent sections instead of drawing divider lines.
- Clamp product names to exactly two lines at a fixed height so cards stay aligned.
- Pin Add To Cart with `mt-auto` so every card in a row bottoms out at the same line.
- Keep hero gradients clearly darker than `{colors.surface-band}` so the banners read as separate objects.
- Use percentage widths on carousel slides to reproduce the equivalent grid column width.
- Give dialogs exactly one primary amber action and let `Esc` / scrim click always close them.
- Keep the detail page's price in `{colors.alert}` and its Add To Cart in `{colors.primary}` — the same split the card uses, just larger.
- Clamp the quantity stepper to the product's stock total so the amber stock bar and the stepper bound can never disagree.

### Don't
- Don't add a border or shadow between page sections — there are none.
- Don't put a drop shadow on any card at rest; cards are flat with a 1px border.
- Don't use `{colors.primary}` for prices or discounts, and don't use `{colors.alert}` for buttons.
- Don't let a product name exceed two lines, and don't let a card's CTA float mid-card.
- Don't add a second accent hue; the palette is amber + red on neutral greys.
- Don't scale button or card type above 14px; density is the design.
- Don't round the carousel controls — they are deliberately square, matching the flat aesthetic.
- Don't let the detail gallery crop or fill its frame; photography stays `object-contain` on card whitespace.
- Don't add a divider or shadow between the detail page's bands — surface and surface-band alternate only.
- Don't blur or tint the dialog scrim, and don't give a dialog panel more than one amber button.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1280px | Full 1200px container; header row is `md:gap-14`; nav menu visible at `lg` |
| Desktop | 1024–1279px | Best sellers 6-up, top saver 4-up, brands 4-up; hero splits 2fr/1fr |
| Tablet | 768–1023px | Category tiles 4-up, brands 2-up, top saver 3-up, best sellers 3-up; nav menu hidden at `lg` |
| Mobile | < 768px | Hero stacks 1-up and hero photos hide; categories 2-up; products 2-up; header stacks with search on its own row; carousel controls hidden (`max-md:hidden`) |

### Product Detail

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1280px | Detail grid splits `5fr 7fr` — gallery left, `card-detail` right |
| Desktop | 1024–1279px | Same 5fr/7fr split; the gallery frame keeps its 360px minimum |
| Tablet | 768–1023px | Grid stays two-up until `lg`, so the gallery drops to 280px and the frame tightens |
| Mobile | < 768px | Grid stacks to 1-up — gallery first, then `card-detail`; the thumbnail rail moves above the frame |

### Touch Targets
- Carousel controls are 24×24px and are **hidden below `md`** rather than being made larger — touch users swipe the track instead.
- Buttons are full-width within their card (min ~30px tall); form fields are ~35px tall.
- The search bar and category tab are ≥ 44px tall.
- The dialog's `dialog-close` is 24×24 on every breakpoint — it is a pointer target on desktop and a visible escape on touch, so it is never hidden.

### Collapsing Strategy
- The display stair is 28 → 24px for hero copy; section titles never scale.
- Hero photography is hidden below `md` rather than shrunk — the text block takes the full banner width.
- Dialogs are edge-to-edge below `sm`: the panel drops to `100vw - 32px` with a 16px gutter, keeps its 24px padding, and scrolls its body rather than growing past `85vh`.
- Grids collapse 8→4→2, 4→2, 6→3→2, 4→3→2 as space demands; carousel slides track the same stair so a carousel and a grid look the same at every width.
- The top-saver signup panel drops below the product carousel below `lg`.

### Image Behavior
All imagery uses `object-contain` inside fixed-height flex boxes and is never cropped. Remote sources are declared in `images.remotePatterns` in `next.config.ts`. Next.js `fill` is not used; explicit `width`/`height` are always supplied.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference tokens directly (`{colors.primary}`, `{rounded.md}`, `{typography.eyebrow}`) rather than pasting raw hex values.
3. Keep product data in `src/data/store.ts`; layout and copy stay in the components.
4. Run `npm run lint` and `npm run build` after edits — the route type check catches prop drift in `Carousel` / `SectionHeader`.
5. Add new button or card variants as separate component entries; vary fill or border, never shape.
6. When adding a section, decide its band colour first so surface and band alternate correctly against its neighbours.
7. Defaults: body is `{typography.body}`, buttons are `{typography.label-tight}`, card names are `{typography.body-small}` at two lines.