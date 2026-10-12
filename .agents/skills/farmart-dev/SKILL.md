---
name: farmart-dev
description: Working knowledge of the Farmart grocery storefront — architecture, conventions, and the traps that look like application bugs but are not. Use this for any feature work, bug hunt or review in this repo before touching code, and whenever the project snapshot below looks stale. Covers the Next.js 16 App Router + SQLite layout, the data layer (`@/db/queries`, `@/lib/data`), cents-based pricing, FTS5 search, Partial Prerendering limits, and how to keep this document's auto-generated section current.
---

# Farmart — how this codebase actually works

Farmart is a Next.js 16.4 (App Router) grocery storefront with **no backend service**: the
entire catalogue is a local SQLite file seeded from TypeScript. That single decision
explains most of what follows — the data-access rules, the caching rules, and nearly every
"the page is empty" report.

This skill is the *how to work here* document. `AGENTS.md` at the repo root remains the
running note and `DESIGN.md` remains the source of truth for visual decisions. Where this
document disagrees with the code, the code is right — and the auto-generated section below
tells you which side moved.

## The three-layer read path

A page never talks to another page, and a page never `fetch`es its own API:

```
seed-data.ts ──▶ SQLite (data/farmart.db, gitignored)
                      │
              db/queries.ts      every SQL statement lives here
                 ├──────────────▶ app/api/**/route.ts   thin handlers: parse → query → ok()/fail()
                 └──────────────▶ lib/data.ts           React.cache wrappers for Server Components
                                      │
                                 app/**/page.tsx        Server Components, usually prerendered
```

- **`db/queries.ts`** owns all SQL. Nothing else writes a `SELECT`.
- **`lib/data.ts`** is the only thing a page imports. Its `React.cache` wrappers dedupe
  repeated reads inside one request.
- **`app/api/**/route.ts`** is the public contract, published at `/api/openapi` and rendered
  by Swagger UI at `/docs`. It deliberately does **not** use `lib/data.ts` — the API must
  not depend on React, or a future mobile client breaks.

Route handlers stay thin by convention: parse params, call one query, wrap in `ok()` or
`fail()` from `lib/api.ts`. If a handler grows SQL, that is the bug.

## Things that are traps, not bugs

Each of these has been verified against the code. Do not "fix" them.

**An empty homepage shelf raises no error.** Sections filter on `product_shelves`. A
product on no shelf is simply invisible, forever, silently. Check `shelves` in
`seed-data.ts` before suspecting the query layer.

**A product exists but search misses it.** The FTS5 index (`products_fts`) inlines the
brand name, which triggers cannot read from a joined table — so it is rebuilt explicitly by
`syncSearchIndex(db)` after every write. Skip that call and you get a searchable-looking
product that is not searchable. `onboard/scripts/doctor.mjs` reports this as a stale index.

**`npm run db:reset` is a bare `rm` with no prompt and no backup.** `data/farmart.db` is
gitignored, so git cannot bring it back. Use
`node .agents/skills/onboard/scripts/seed-db.mjs` — it refuses to delete rows the seed file
cannot recreate. Never `rm data/farmart.db` while the dev server is running: the process
keeps the deleted inode open and serves stale rows from memory.

**The database is created lazily**, on the first request that reads it — not at server
start, and not by `/api/hello` (which returns a constant). After a reset, `npm run dev`
alone leaves `data/` empty; hit `/api/categories` or run `seed-db.mjs`.

**A missing product renders the not-found UI with a 200 status.** Partial Prerendering
flushes the shell before the lookup finishes, so `notFound()` cannot set a 404. Verified
against a minimal probe route — a framework limitation, not an app bug.

**Sync SQLite reads count as predictable values to Cache Components**, so they prerender into
the static shell. That is a feature: it is why the homepage is fast. A read that must be
per-request needs `await connection()` as its first statement.

**`params` / `searchParams` are Promises** in Next 16. `cacheComponents: true` rejects
reading them outside a `<Suspense>` boundary — pass the promise into a child rather than
awaiting it in the page body. `dynamicParams`, `revalidate` and `fetchCache` are rejected
outright.

**`npm test` asserts exact counts** (29 products, 8 categories, and friends) that mirror
`seed-data.ts`. Change the seed and update the *real* numbers in the test expectations;
loosening an assertion stops it catching the bug it was written for.

## Money

Prices are **integer cents** in SQLite (`price_cents`). There is no stored display string.
`formatCents()` / `formatPrice()` in `lib/format.ts` produce `"$38.00"` at serialisation
time. The API returns both forms deliberately:

- `price: "$38.00"` — for display
- `priceValue: 38` — for arithmetic

Never parse one back out of the other. `lib/sorts.ts` lives outside `db/queries.ts` on
purpose: a `"use client"` component needs the `sort` allowlist too, and importing the query
layer would drag `better-sqlite3` into the browser bundle.

## Verification

```bash
npm run lint          # eslint
npx tsc --noEmit      # the typecheck step; there is no `typecheck` script
npm test              # vitest, single run, in-memory DB
npm run test:e2e      # playwright, builds and boots on port 3210
```

Order matters, and `npm run build` runs the typecheck again. Add `test:e2e` whenever the
change touches rendering, routing or a client component — the E2E helpers in
`e2e/support/app.ts` exist to defeat specific traps (hydration races, double-DOM during
client navigation, `%20` vs `+` in search params). Read that file before writing a spec
rather than adding a `waitForTimeout`.

Before starting on an unfamiliar or freshly-pulled checkout, run the `onboard` skill first:
most "the app is broken" reports are a checkout that was never provisioned.

## Keeping this document current

The section below the marker is generated. Do not hand-edit it — a hand edit is silently
overwritten on the next pass, which is worse than not editing it.

```bash
npm run skill:sync     # one pass, writes only if something changed
npm run skill:watch    # loop every 1 minute
npm run skill:verify   # fail if the document is stale
```

`skill:watch` takes `--interval <seconds>` if a minute is the wrong cadence for the
machine you are on, and `--once` to run a single pass and exit.

What the loop watches, and why each signal is there:

| Signal | Why it is in the doc |
| --- | --- |
| Route tree + HTTP methods | A new endpoint that never reaches `openapi.ts` shows up as a mismatch, not as a silent omission |
| `instant = false` routes | Those block the shell; they are the ones that hurt latency |
| `"use client"` per component | Tells you which parts can hold state, and which cannot |
| Schema tables + live row counts | Catches a seed edit that the committed expectations no longer match |
| Shelf membership | The one thing whose absence is completely silent in the app |
| Exported symbols per module | Renames show up as diffs instead of as import errors later |
| Test and E2E case counts | A deleted test is a coverage regression, not a refactor |
| Source size per area | Refactors that grow a module are visible in review |
| Branch / HEAD | Anchors the snapshot to a commit you can go and read |

The counts come from booting the app's own `db/client.ts` against `:memory:` — same
migrations, same seed, same FTS index as the server — never from `data/farmart.db`. When
that boot fails the section degrades to static facts and says so rather than lying.

`skill:watch` is a foreground process: `Ctrl-C` stops it. It writes only on change, so an
idle tree costs one `stat` sweep per tick and produces no git noise. A tick that finds a
change rewrites the marked region in place, so the document is never more than a minute
behind the code.

<!-- farmart-dev:auto:begin -->

## Project snapshot (auto-generated)

_Generated by `farmart-dev/scripts/sync.mjs`. Do not hand-edit below this line; edit the script instead. Last run 2026-10-12 11:03Z._

### Versions

| Thing | Value |
| --- | --- |
| Branch / HEAD | main |
| Next.js | 16.4.0 |
| React | 19.3.0 |
| Database | ^13.0.3 |
| Node on this machine | v22.17.1 |
| Tailwind | ^4 |
| TypeScript | ^5 |

### Routes

| URL pattern | Kind | Handler | Notes |
| --- | --- | --- | --- |
| `/` | page | — |  |
| `/api/brands` | api | GET |  |
| `/api/categories` | api | GET |  |
| `/api/categories/[name]/products` | api | GET |  |
| `/api/hello` | api | GET |  |
| `/api/openapi` | api | GET |  |
| `/api/products` | api | GET |  |
| `/api/products/[id]` | api | GET |  |
| `/api/products/[id]/related` | api | GET |  |
| `/api/shelves/best-sellers` | api | GET |  |
| `/api/shelves/top-savers` | api | GET |  |
| `/design` | page | — |  |
| `/docs` | api | GET |  |
| `/mermaid` | page | — |  |
| `/product/[id]` | page | — | `instant = false` (blocks the shell) |
| `/search` | page | — |  |
| `/tests` | page | — |  |

### Components

| File | Rendering | Exports |
| --- | --- | --- |
| `src/components/breadcrumb.tsx` | server | Breadcrumb |
| `src/components/buy-panel.tsx` | client | BuyPanel |
| `src/components/carousel.tsx` | client | Carousel, CarouselControls, CarouselItem |
| `src/components/design-system/dialog-specimens.tsx` | client | DialogSpecimens |
| `src/components/design-system/product-specimens.tsx` | client | ProductSpecimens |
| `src/components/design-system/shell.tsx` | server | Spec, Section, Panel, SpecRow, Hex, SwatchGrid |
| `src/components/dialog.tsx` | client | Dialog, DialogPrimaryButton, DialogSecondaryButton |
| `src/components/header.tsx` | server | Header, NavBar |
| `src/components/hero.tsx` | server | Hero |
| `src/components/mermaid-viewer.tsx` | client | MermaidViewer |
| `src/components/product-card.tsx` | server | SectionHeader, ProductCard |
| `src/components/product-gallery.tsx` | client | ProductGallery |
| `src/components/product-parts.tsx` | server | RatingStars, PriceRow, StockTrack, DiscountBadge |
| `src/components/product-tabs.tsx` | client | ProductTabs |
| `src/components/search-bar.tsx` | client | SearchBar, SearchBarFallback |
| `src/components/search-controls.tsx` | client | SearchControls |
| `src/components/search-results.tsx` | server | SearchResults |
| `src/components/search-suggestions.tsx` | client | SearchSuggestions |
| `src/components/sections.tsx` | server | BrowseByCategory, FeaturedBrands, TopSaverToday, BestSeller |

### Data layer

| Table | Rows |
| --- | --- |
| `brands` | 9 |
| `categories` | 8 |
| `product_highlights` | 87 |
| `product_images` | 86 |
| `product_shelves` | 18 |
| `product_specs` | 116 |
| `products` | 29 |
| `products_fts` | 29 |
| `shelf_filters` | 7 |

Shelf membership: `best-sellers` 13, `top-savers` 5. A product on no shelf is invisible on the homepage and raises no error.

### Query and lib exports

| Module | Exports |
| --- | --- |
| `src/db/queries.ts` | getCategory, getProduct, getRelatedProducts, getShelfFilters, getShelfProducts, listBrands, listCategories, orderByClause, searchProducts, toMatchQuery |
| `src/db/seed.ts` | seed, seedIfEmpty, syncSearchIndex, truncateAll |
| `src/lib/data.ts` | getBestSellers, getBrands, getCategories, getProductDetail, getRelated, getTopSavers, searchCatalogue |
| `src/lib/api.ts` | fail, ok, pickParam |
| `src/lib/api-types.ts` | — |
| `src/lib/format.ts` | formatCents, formatPrice, parsePrice |
| `src/lib/sorts.ts` | DEFAULT_SORT, SORT_KEYS, SORT_OPTIONS, toSortKey |
| `src/lib/mermaid.ts` | buildErDiagram, mermaidErSource, readSchema |
| `src/lib/coverage.ts` | readCoverage |

### Tests

| Test file | Suites | Cases |
| --- | --- | --- |
| `src/app/api/api.test.ts` | 10 | 28 |
| `src/db/queries.test.ts` | 9 | 34 |
| `src/db/seed.test.ts` | 3 | 10 |
| `src/lib/coverage.test.ts` | 1 | 5 |
| `src/lib/format.test.ts` | 3 | 6 |

| E2E spec | Cases |
| --- | --- |
| `e2e/api.spec.ts` | 7 |
| `e2e/home.spec.ts` | 12 |
| `e2e/navigation.spec.ts` | 13 |
| `e2e/product.spec.ts` | 10 |
| `e2e/search.spec.ts` | 31 |

### Source size

| Area | Files | Lines |
| --- | --- | --- |
| `src/components` | 19 | 2239 |
| `src/db` | 7 | 2009 |
| `src/app` | 21 | 1882 |
| `src/lib` | 11 | 1366 |
| `src/test` | 1 | 9 |

### npm scripts

| Script | Command |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` |
| `test:e2e:ui` | `playwright test --ui` |
| `test:e2e:report` | `playwright show-report` |
| `e2e:server` | `node e2e/reset-db.mjs && next build && next start -p ${E2E_PORT:-3210}` |
| `db:reset` | `rm -f data/farmart.db data/farmart.db-shm data/farmart.db-wal` |
| `skill:sync` | `node --experimental-strip-types --no-warnings .agents/skills/farmart-dev/scripts/sync.mjs` |
| `skill:watch` | `node --experimental-strip-types --no-warnings .agents/skills/farmart-dev/scripts/watch.mjs` |
| `skill:verify` | `node --experimental-strip-types --no-warnings .agents/skills/farmart-dev/scripts/verify.mjs` |

<!-- farmart-dev:auto:end -->