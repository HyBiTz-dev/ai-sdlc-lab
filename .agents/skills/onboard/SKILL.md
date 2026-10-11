---
name: onboard
description: Get this project running from a cold checkout, or repair a working tree that cannot develop. Use this skill whenever someone starts work in this repo for the first time, after a fresh clone or a `git pull`, when the dev server fails to boot, when `data/farmart.db` is missing or stale, when a page shows an empty shelf / 404s / shows raw prices, when the catalogue data looks wrong or empty, or when asked to "set up the project", "reset the database", "seed the data", "start from scratch", or "why is nothing showing". Use it before touching any feature work — it is the fastest way to tell a real bug apart from a checkout that was never provisioned.
---

# Onboarding: from cold checkout to running app

This project is a Next.js storefront backed by a **SQLite file that is a build
artefact, not a source file**. `data/farmart.db` is gitignored, and the rows in
it are generated from `src/db/seed-data.ts` the first time something reads the
database. That single fact explains most "the app is broken" reports: nothing is
broken, the checkout just has never been provisioned.

This skill gets you to a state where you can trust the app's output, and tells
you honestly when the current state is not that.

## The one rule about data

**`data/farmart.db` cannot be recovered from git.** There is no undo for
`rm data/farmart.db` if the file holds rows that `seed-data.ts` cannot recreate
— someone may have edited rows in a SQLite browser, or the seed file may have
been reverted while the database still reflected a newer version.

So the default posture is **inspect, then decide**. Never reach for
`npm run db:reset` reflexively; it is a bare `rm` with no prompt and no backup.
Run the doctor first, read what it says, and let it tell you whether a reset is
recoverable.

The flip side: if the database *does* match the seed file, everything in it is
disposable by definition. That is the common case on a clean checkout, and it is
why a reset there costs nothing.

## Workflow

### 1. Check where the checkout stands

```bash
node .agents/skills/onboard/scripts/doctor.mjs
```

Read the output before doing anything else. It checks the Node version, that
dependencies are installed, that the `better-sqlite3` native binding loads
against the *current* Node, what `seed-data.ts` declares versus what the
database holds, foreign-key integrity, and whether the FTS search index is in
sync. Exit codes: `0` ready, `2` usable with warnings, `1` blocked.

Three results matter:

- **`database does not exist yet`** — normal on a fresh clone. Go to step 3;
  the file appears on the first read.
- **`database matches seed-data.ts`** — safe to reset, and usually nothing to do.
- **`database has diverged from seed-data.ts`** — the database holds rows the
  seed file does not describe. **Stop and ask the user before destroying it.**
  Report the two counts and what the difference implies; let them decide
  whether to keep the rows, back them up, or replace them.

### 2. Provision dependencies

Only if the doctor said a dependency is missing:

```bash
npm install
```

If it flagged the native binding instead, `npm install` will not help — the
prebuilt binary was compiled against a different Node:

```bash
npm rebuild better-sqlite3
```

That symptom is easy to misread as a broken app, because the error surfaces at
query time rather than install time.

### 3. Build the database

```bash
node .agents/skills/onboard/scripts/seed-db.mjs
```

This compares the database against the seed file, rebuilds via the app's own
`src/db/client.ts` so migrations and the FTS index run exactly as they do in the
server, and prints the resulting counts. It is a no-op when the database is
already correct.

It refuses to delete a diverged database. `--force` overrides that, and moves
the old file to a timestamped `.bak` first so the decision stays reversible.

If you would rather not use the script, the equivalent is: start the server and
hit any endpoint that reads the database.

```bash
npm run dev
curl -s -o /dev/null http://localhost:3000/api/categories
```

The `curl` is load-bearing. The database is created lazily on the first request
that reads it, **not** when the server starts, so `npm run dev` alone leaves
`data/` empty. `/api/hello` does not touch the database either — it will not
trigger anything.

### 4. Confirm it end to end

```bash
node .agents/skills/onboard/scripts/doctor.mjs --live
```

Probes `/api/categories`, `/api/products`, and `/api/shelves/top-savers`. This
is the check that catches "the database seeded fine but the page is still
empty" — a query-layer or prerender problem the offline checks cannot see.

Then look at the actual pages, because that is what the user will judge:

- `/` — hero, category tiles, promo brands, top savers, best sellers
- `/search` — a query like `?q=coffee` returning results, and faceted filtering
- `/product/atlantic-salmon-fillet` — gallery, specs, highlights, price row
- `/docs` — Swagger UI rendering the OpenAPI spec

### 5. Run the test suite

```bash
npm run lint && npx tsc --noEmit && npm test
```

`npm test` seeds an in-memory database and **asserts exact counts that mirror
the seed file** (29 products, 8 categories). Those numbers are not decorative:
if you have edited `seed-data.ts`, the failures are telling you the seed and the
assertions disagree. Update the numbers in `src/db/queries.test.ts` and
`src/app/api/api.test.ts` to the new values rather than loosening the
assertions — a relaxed count stops catching the class of bug it was written for.

There is no `typecheck` script; `npx tsc --noEmit` is the typecheck step, and
`npm run build` runs it again.

## Reading the project's conventions once

`AGENTS.md` at the repo root is the running note on this codebase. Read it
before feature work. The parts that trip people up most:

- Pages read the database directly through `@/lib/data`; they do **not** fetch
  `/api`. Route handlers read `@/db/queries` directly. An HTTP round-trip
  between them would be latency for nothing.
- `cacheComponents` is on. `params` / `searchParams` are Promises and must be
  awaited inside a `<Suspense>` boundary. `dynamicParams`, `revalidate` and
  `fetchCache` are rejected outright.
- Prices are integer cents in the database. Display strings are produced by
  `formatCents()` at serialisation time, never stored.
- Any write must call `syncSearchIndex(db)`, because FTS5 rows inline the brand
  name and cannot be read from a joined table. Skip it and the product exists
  but is unsearchable.
- `DESIGN.md` is the source of truth for visual decisions; `PLAN.md` (Thai) is
  the progress tracker. Both are untracked in git — a fresh clone will not have
  them.

## Things worth knowing

**Empty shelf, no error anywhere.** The homepage sections filter on
`product_shelves` and `shelf_filters`. A product that is on no shelf simply
never appears; nothing warns you. Check the shelf membership in
`seed-data.ts` before suspecting the query layer.

**A product exists but search misses it.** Almost always a stale FTS index —
the doctor reports this as a warning, and `seed-db.mjs` repairs it
automatically when the row counts already match.

**`npm test` never touches `data/farmart.db`.** `src/test/setup.ts` points
`FARMART_DB_PATH` at `:memory:`, so each test file gets its own seeded
database. You can run the suite against a diverged development database
without consequence.

**Images come from `images.unsplash.com` only.** Any other host fails the build
at the `next.config.ts` `remotePatterns` check, not at the component.

**A missing product renders the not-found UI with a 200.** This is a Partial
Prerendering limitation, verified against a minimal probe route — not an app
bug. Don't chase it.
