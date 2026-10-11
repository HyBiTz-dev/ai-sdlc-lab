# Review instructions

## What Important means here

A single Next.js app on a single SQLite file. No multi-tenant, no auth, no
billing. Reserve 🔴 for findings that would break the storefront for a user, lose
data, or corrupt the database:

- Wrong query result, wrong price, wrong count, wrong sort, missing pagination
  boundary, a shelf that silently renders nothing
- Crashing render, `await` misuse, a component that reads DB state outside a
  `Suspense`/`connection()` boundary
- Anything that can lose or corrupt rows: writes without
  `syncSearchIndex(db)`, a seed that can leave an empty database, a `rm` of
  `data/farmart.db` while the server holds it open
- A test that passes while asserting nothing, or an `api.test.ts` case that never
  `await`s a handler before reading `.status` / `.json()`

Nit at most: layout, copy, Tailwind colours not using the `@theme inline`
tokens, component extraction, dead code.

## Repo-specific checks — always flag

- **A new `src/app/api/**` route has no case in `src/app/api/api.test.ts`.**
- **A write path in `src/db/` does not call `syncSearchIndex(db)` afterwards.**
- **A change to `src/db/seed-data.ts` does not update the pinned counts in the
  tests** (29 products / 8 categories / 13 best-sellers / 6 Farmart / 10
  on-sale, the `toEqual` slug list in `listCategories`, and the `total % limit`
  page splits). Report the stale expectation, not the test failure.
- **A change to `DESIGN.md` is not mirrored in `src/lib/design-tokens.ts`** (or
  the reverse).
- **A new `categories` slug is missing from `seedCategories`, `shelf_filters`,
  and `seedProducts`.**
- **Route handlers import `@/lib/data`** — they must read `@/db/queries`
  directly, because the API cannot depend on React.
- **A page `fetch`es `/api` from the server** instead of calling `@/lib/data`.

## Verification bar

Behaviour claims need a `file:line` citation read from the source, not an
inference from a function or file name. Before reporting a 🔴, state the input
that triggers it. If you cannot name one, it is 🟡 or it is nothing.

## Cap the nits

At most five nits per review. If you found more, report "plus N similar" in the
summary instead of listing them. If every finding is a nit, lead with
"No blocking issues."

## Do not report

- Anything `npm run lint`, `npx tsc --noEmit`, or `npm test` already catches.
- `coverage/`, `data/`, `graphify-out/`, `*.lock`
- Next.js dev-tool pages (`/mermaid`, `/tests`, `/docs`, `/design`) unless the
  change breaks them for everyone, not just on a stale build
- The 404-status caveat on `/product/[id]` and the hardcoded-hex Tailwind colours
  — both are documented, deliberate decisions in `AGENTS.md`