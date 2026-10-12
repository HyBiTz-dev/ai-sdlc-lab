# Farmart — agent notes

Next.js 16.4 (App Router, `src/app`) + React 19 + Tailwind v4 + SQLite (`better-sqlite3`). Single package, no CI. Tests run locally via Vitest; there is no CI runner to enforce them.

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # also the typecheck step (noEmit is on)
npm run lint
npx tsc --noEmit # standalone typecheck
npm test         # unit + integration (vitest, single run)
npm run test:coverage
npm run test:e2e # browser regression (playwright, builds and starts the app)
```

There is no `typecheck` script. Verification order: `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm run build`. Add `npm run test:e2e` when the change touches rendering, routing or a client component.

**Before feature work on an unfamiliar checkout, run the `onboard` skill** (`node .agents/skills/onboard/scripts/doctor.mjs`). It distinguishes a real bug from a checkout that was never provisioned, and it refuses to delete database rows the seed file cannot recreate. Most "the app is broken" reports in this repo are the latter.

## Repo layout

- `DESIGN.md` — the design spec. **Source of truth for all visual decisions** (tokens, type scale, component rules, responsive breakpoints).
- `PLAN.md` — the roadmap, written in Thai, grouped as Phase 0–6 mapped to Requirements 1–6. Checkbox state is the live progress tracker; update it when finishing a task instead of inventing a new todo file.
- `src/lib/design-tokens.ts` — a mirror of the DESIGN.md token block that `/design` renders. Comment says keep both in sync; change a colour/token in both places.
- `src/db/` — SQLite layer. `client.ts` (one `better-sqlite3` handle, memoised on `globalThis`), `schema.ts` (idempotent migrations + FTS5 table), `seed-data.ts` (the seed catalogue), `seed.ts` (import + search index), `queries.ts` (every read, shared by the API and `src/lib/data.ts`).
- `src/app/api/` — the JSON API for external clients. Route handlers stay thin: parse params, call one query, wrap in `ok()` / `fail()` from `src/lib/api.ts`.
- `src/app/search/actions.ts` — the **only server action** in the repo: `suggestProducts(term, category)`, the typeahead behind the header search box. A client component that needs a query reaches for a server action rather than `fetch`ing our own `/api` — same process, no HTTP round-trip, and `better-sqlite3` stays on the server. It calls the same `searchProducts` the API route does, capped at 3 rows.
- `src/lib/data.ts` — **data-access layer for Server Components.** Pages call these (`getTopSavers`, `getCategories`, `searchCatalogue`, `getProductDetail`, …) instead of `fetch`ing `/api`. Wrapped in `React.cache` so repeated calls in one request share a query. Route handlers deliberately do *not* use this layer — they read `@/db/queries` directly, since the API must not depend on React.
- `src/lib/api-types.ts` — wire types shared by route handlers and UI components. This is the contract, not `store.ts` types. Keep it in sync with `openapi.ts` when a DTO changes.
- `src/lib/sorts.ts` — the `sort` allowlist (`SORT_KEYS`, `toSortKey`), deliberately outside `@/db/queries` because `"use client"` components validate the param too and importing the query layer would pull `better-sqlite3` into the client bundle. The ORDER BY clauses themselves stay in `queries.ts`.
- Tests live beside the code as `*.test.ts` and run under Vitest. `src/test/setup.ts` points `FARMART_DB_PATH` at `:memory:`, and Vitest gives each test file a fresh module registry — so every file gets its own seeded database and never touches `data/farmart.db`. Tests that mutate rows must restore them (`truncateAll` + `seed` from `@/db/seed`).
- `src/app/api/api.test.ts` is the integration layer: it imports the route handlers and calls them with a `NextRequest`. That covers query + serialiser + HTTP status without a listening server. Handlers may be sync or async, so tests must `await` before reading `.status` or `.json()`.
- `playwright.config.ts` + `e2e/` — the browser regression layer. `testDir` is `./e2e`, port **3210** (never 3000, so a dev server is not mistaken for the thing under test), and `webServer` runs `npm run e2e:server` = `reset-db.mjs && next build && next start`. It builds rather than using `next dev` on purpose: prerendering, the `/mermaid` + `/tests` build-time reads, and the PPR shell behaviour only exist in a build. Two projects — `desktop` (1440×900, `grepInvert: /@responsive/`) and `mobile` (Pixel 5, `grep: /@responsive/`) — so a `@responsive`-tagged spec runs at phone width only.
- `e2e/reset-db.mjs` deletes `data/e2e/farmart-e2e.db` before the server boots. **It cannot be a Playwright `globalSetup`**: the database is created lazily on the first request that reads it, and Playwright's readiness probe against `webServer.url` *is* such a request — a globalSetup would unlink the file after `next start` opened it. The script refuses to delete anything outside `data/e2e/`. `FARMART_DB_PATH` keeps the run off `data/farmart.db`.
- `e2e/support/app.ts` holds the shared helpers, and each one exists because of a specific trap in this app:
  - `visit()` waits for `domcontentloaded`, never `load` — the layout pulls Font Awesome from a CDN and imagery from Unsplash, so `load` hands every test to a third party. Nothing asserts on an image.
  - `ready()` / `hydrated()` poll for React's `__reactFiber$` key. Every page is a server component that streams, so a click that lands before hydration is **silently swallowed** — the tabs, stepper, carousel and search box all look broken against a working page. A fixed sleep is the wrong fix; this is a direct signal.
  - `productIdsIn()` reads `container:visible` and waits for two consecutive equal reads. During a client-side navigation the outgoing and incoming pages are **both** in the DOM, so a bare `main` matches two elements and returns the previous page's products.
  - `searchBox()` / `categoryPicker()` filter on `visible` for the same reason, and because the leftover is worse than merely stale: the outgoing page's `<header>` stays mounted *permanently* and, `body` being a column flex container, gets flex-shrunk to a 0×0 box. `getByLabel` still matches it, so an unfiltered locator either trips strict mode or hands Playwright an element it waits the full test timeout to type into.
  - `expectSearchParam()` polls the decoded `URLSearchParams`. `router.push` percent-encodes spaces as `%20` where `URLSearchParams.toString()` writes `+`, and `toHaveURL(/\/search\?/)` matches *before* the navigation lands.
  - `sectionFor(page, trackId)` scopes by carousel `trackId`. `SectionHeader` titles are plain divs with no role, and `getByText(title, { exact: true })` does not match them — the div also holds the "All Categories >" link.
- E2E expectations are read from `/api` and compared against the DOM, not written down twice. A hardcoded count only tells you the seed changed; comparing the two tells you the **UI drifted from the data layer**. The limitation is that a regression inside the shared query layer moves both sides together and stays invisible — mutation-test UI-only paths when extending this.
- `/docs` is a **route handler**, not a page: no `<main>`, nothing to hydrate, Swagger UI mounts into an empty div from a CDN bundle. Use `visitDocument()`, and assert the mount point plus `toHaveTitle` rather than the rendered operation list.
- `products_fts` itself **is** in the Mermaid diagram. Only its shadow tables (`products_fts_data`, `_idx`, `_content`, …) are filtered, by `FTS_SHADOW_SUFFIX` in `src/lib/mermaid.ts`.
- `npm run test:coverage` writes `coverage/` (gitignored). `/tests` reads `coverage/coverage-summary.json` and shows an empty state when it is missing — `src/lib/coverage.ts` also tolerates a *truncated* file (the report is written incrementally, so an interrupted run leaves half a JSON document) and Istanbul's `"Unknown"` percentage, which is a string rather than a number.
- `src/lib/mermaid.ts` — reads the live schema via `PRAGMA` and builds a Mermaid `erDiagram` string. `/mermaid` renders it. Do not hardcode entities: add a column to a migration and the diagram follows. FTS5 shadow tables (`products_fts_data` and friends) are filtered out.
- `.opencode/plugins/` — OpenCode plugins, auto-loaded from the directory (no config entry needed). `block-rm-rf.ts` throws from an `execute.before` hook to reject `rm -rf`; `lint-after-edit.ts` runs ESLint (see Lint hook below). Both are loaded against `ctx.tool.hook`, and the event stream must be aborted in the `setup` cleanup function.
- `.agents/skills/onboard/` — **use before feature work.** `SKILL.md` (workflow), `scripts/doctor.mjs` (read-only state check; `--live` also probes the API), `scripts/seed-db.mjs` (rebuilds the database, refuses to delete rows the seed file cannot recreate, `--force` moves the old file to a timestamped `.bak`). `scripts/_boot-client.mjs` is the shared loader that boots the app's own `src/db/client.ts` under `node --experimental-strip-types` and resolves the `@/` alias, so scripts and server always see the same schema.
- The seed runs in one transaction with FKs on, so one bad `brandId` or `category` rolls back the entire import and leaves an empty database — the doctor's empty-database warning is built around that failure mode.
- `src/lib/openapi.ts` — OpenAPI 3.0 spec, served as JSON at `/api/openapi` and rendered by Swagger UI at `/docs`.
- `src/app/design/page.tsx` — visual catalog of the design system, wired to `design-tokens.ts`.
- `src/components/` — flat, one component per file. `product-parts.tsx` holds `PriceRow` / `RatingStars` / `StockTrack`; `sections.tsx` holds homepage sections.

`DESIGN.md`, `PLAN.md`, `CLAUDE.md`, `.claude/`, `.agents/`, and `.opencode/` are untracked in git — they exist only in the working tree. Don't assume a fresh clone has them. On macOS `.claude/skills/` and `.agents/skills/` are hardlinked (same inode), so editing either updates both; on other platforms they are separate copies and need syncing by hand.

## Lint hook

`.opencode/plugins/lint-after-edit.ts` runs ESLint for you. Two passes, because each catches what the other misses:

- **Scoped** — `ctx.tool.hook("execute.after")` on `write` / `edit` / `patch`, collecting the touched paths (`patch` is parsed from its `*** Add/Update/Delete File:` headers) and linting only those files. Debounced 1.2s so a multi-file edit burst costs one run.
- **Project** — on the `session.idle` event (`ctx.event.subscribe`), it cancels the pending scoped run and lints the whole project, which is the only pass that sees cross-file breakage.

A failing run is fed back with `ctx.session.synthetic()` so you can fix it in the same turn. Expect that message mid-turn: it is not a new user request. Three guards stop it looping — max 3 auto-fix rounds per session (reset by any clean run), a skip when the output is byte-identical to the last report, and `lastReport` cleared on success. If you see the same lint error reported more than once after already fixing it, you are past the round cap and the message is the final one.

Notes when editing the plugin:

- It shells out to `node_modules/.bin/eslint` directly, resolved from `ctx.location.directory`, and disables itself with a console warning if that binary is missing. `npm run lint` is just `eslint` with no arguments.
- ESLint exits non-zero on errors only — warnings do not trip the hook. Do not "fix" that by lowering `--max-warnings`.
- State is keyed by `sessionID` and the entry is dropped after each project pass, so a long session does not accumulate map entries.
- `.opencode/plugins/` is inside the ESLint scope. A `no-explicit-any` in a plugin file fails the project pass and the hook will keep reporting it — type the `ctx`/`event` arguments rather than reaching for `any`.

## Framework quirks

- `next.config.ts` sets `cacheComponents: true`, `partialPrefetching: true`, and `serverExternalPackages: ["better-sqlite3"]` (native addon, must stay outside the bundle). Page props use Next's generated global types: `params` / `searchParams` are **Promises**, so `await params`. Use `PageProps<"/route">` and `LayoutProps<"/">` rather than hand-written prop types.
- **Pages read the database directly through `@/lib/data` — they do not fetch `/api`.** Same process, so an HTTP round-trip would only add latency and a JSON parse. The API exists for external clients (a future mobile app) and for `/docs`.
- A component that reads `params` / `searchParams` must await them **inside** a `<Suspense>` boundary; `cacheComponents` rejects uncached or runtime reads outside one. Pass the promise into a child rather than awaiting it in the page body.
- `/product/[id]` is the exception: it sets `export const instant = false` and blocks, because it must know whether the product exists before committing to a response.
- **`notFound()` cannot set a 404 status under Partial Prerendering** — the shell is flushed with 200 before the lookup finishes. Verified against a minimal probe route; it is a framework limitation, not an app bug. A missing product currently renders the not-found UI with a 200 status. Fix it with a rewrite/middleware if a real status matters.
- `dynamicParams`, `revalidate` and `fetchCache` are rejected when `cacheComponents` is on.
- Tailwind v4 with no config file: theme values live in the `@theme inline` block of `src/app/globals.css` (`primary`, `alert`/`badge-red`, `border`, `page`, `font-sans`, `container-page` utility). Use those token utilities rather than raw hex; raw hex is tolerated only where DESIGN.md pins one.
- Route alias: `@/*` → `./src/*` (tsconfig `paths`).
- Font Awesome is loaded from a CDN `<link>` in `src/app/layout.tsx`, and the Prompt font via `next/font`. Icons are `<i className="fa-solid ...">`; don't add an icon dependency.
- `images.remotePatterns` only allows `images.unsplash.com`. Any other image host fails the build.
- `next.config.ts` wires `@tailwindcss/turbopack` via a `*.css` rule — Turbopack is the default bundler, CSS goes through that loader.
- Root layout is `lang="th"`; UI copy in the components is English.
- Dev-tool pages (`/mermaid`, `/tests`) use a slim inline header with links to the other dev pages, not the storefront `Header`/`NavBar`. They still need a `Header` wrapper if they show a page header, but skip the storefront chrome.
- Mermaid renders in `useEffect` from a CDN ES module — it needs a DOM and cannot run during server render. The instance is cached on `window` so tab switches do not re-download it. The `erDiagram` source itself is generated on the server and passed down as a prop, so the code tab works without JS.
- `vitest.config.ts` resolves the `@/` alias itself; Vitest does not read tsconfig `paths`. Adding an import the alias does not cover will fail at transform time with a parse error, not a "cannot find module" message.

## Data / state

- **Prices are integer cents** in SQLite (`price_cents`) and never display strings. The API returns both: `price` (`"$4.75"`) for display and `priceValue` (`4.75`) for arithmetic. Format with `formatCents()` / `formatPrice()` from `src/lib/format.ts`. This retires the `parsePrice()` string-stripping helper's original role.
- The database is a build artefact of the working tree: `data/farmart.db` (+ `-wal` / `-shm`) is **gitignored**, so git cannot recover it. `npm run db:reset` is a bare `rm` with no prompt and no backup. Prefer `node .agents/skills/onboard/scripts/seed-db.mjs`, which refuses to delete rows the seed file cannot recreate and backs up to a timestamped `.bak` under `--force`.
- **Never `rm data/farmart.db` while the server is running.** The process keeps the deleted inode open and will keep serving the old rows from memory; deleting then recreating leaves the two out of sync. Stop the server first, or use `seed-db.mjs`.
- **The database is created lazily, on the first request that reads it** — not when the server starts, and not by `/api/hello` (which returns a constant without touching the DB). After `db:reset`, hit a real endpoint such as `/api/categories`, or use `seed-db.mjs` which boots the client itself.
- **WAL caveat when recovering from a `.bak`:** opening a `.bak` with the `sqlite3` CLI checkpoints and truncates its `-wal` first, which discards rows that were never flushed into the main file. Read a backup exactly once, or copy it (`.bak` + `.bak-wal`) elsewhere first.
- `better-sqlite3` is synchronous, so Cache Components treats a query as a **predictable value** and prerenders it. Anything that must be per-request needs `connection()` first.
- Writes must call `syncSearchIndex(db)` afterwards — FTS5 rows carry the brand name inline, which triggers cannot read from a joined table. Skip it and the product exists but is unsearchable; `doctor.mjs` reports this as "search index is stale".
- **Changing `seed-data.ts` breaks the test assertions, and not only the counts.** `npm test` pins 29 products / 8 categories / 13 best-sellers / 6 Farmart / 10 on-sale, plus `totalPages` arithmetic, the `toEqual([...])` slug list in `listCategories`, and page-length splits that depend on `total % limit`. Add a product and the last page grows a row — a 4-page split needs a new `fourth` variable, not an edited number. Update the real expectation; do not relax it, or the assertion stops catching the bug it was written for.
- Adding a **category** means editing three places, not one: `seedCategories` (slug, label, lines, icon), any `shelf_filters` entry that should filter by it, and `seedProducts`. A filter label that is not a `categories.label` silently filters to zero results.
- There is no cart state yet. `PLAN.md` Phase 0.1 specifies the intended shape (`src/lib/cart-store.tsx`, `useReducer`, `localStorage` key `farmart.cart`, hydrate in `useEffect` to avoid hydration mismatch). Follow that spec rather than inventing another store.
- Search filter state lives **in the URL** (`/search?q=&category=&brand=&sort=&onSale=&page=`), so pages stay server components. Only `search-bar.tsx` and `search-controls.tsx` are client components; facets and pagination are links.
- Many interactive elements are still static markup (Add To Cart, countdown, register form). Adding behaviour means wiring the client component; several components are currently server components and need `"use client"` first.

## Diagnostics

Read these before concluding a page is broken — each has a non-obvious cause that looks like an application bug:

- **`node .agents/skills/onboard/scripts/doctor.mjs`** — Node version, native binding, seed file vs database row counts, foreign keys, FTS freshness. Add `--live` to probe the running API. Exit codes: `0` ready, `2` usable with warnings, `1` blocked.
- **An empty homepage shelf with no error anywhere** — the sections filter on `product_shelves`, so a product on no shelf simply never appears and nothing warns you. Check the `shelves` array in `seed-data.ts` before suspecting the query layer.
- **A product exists but search returns nothing** — almost always a stale FTS index, not a missing row.
- **`/mermaid` and `/tests` are prerendered.** They read the database and the coverage JSON at build time, so stale output means a stale build, not a broken page.
- **Data doesn't appear in the browser Network panel.** Server Components fetch on the server, so the data rides along in the RSC payload inside `self.__next_f.push` in the HTML. Look in Elements, not Network.

## Conventions

- Dialogs use the native `<dialog>` element via `src/components/dialog.tsx`; keep using it rather than a modal library.
- Product names keep the 2-line clamp (`.clamp-2` in globals.css).
- Local Tailwind colours are often spelled out in JSX (`#1a1a1a`, `#e2e2e2`) matching DESIGN.md tokens — check the token list before "fixing" them.
- No formatter or pre-commit hooks; match surrounding style (2-space indent, double quotes).
- ESLint runs on your edits automatically — see [Lint hook](#lint-hook). It replaces the reflex of running `npm run lint` by hand, but it is not a substitute for `npx tsc --noEmit`, which nothing checks for you.

## Security

`.claude/settings.local.json` contains a live-looking `ANTHROPIC_AUTH_TOKEN`. Do not commit it, echo it into files, or paste it into docs.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
