import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";
import type {
  BrandDto,
  CategoryDto,
  ProductDetailDto,
  ProductPageDto,
  ShelfDto,
} from "../../src/lib/api-types";

/**
 * Locators and API readers shared by the specs.
 *
 * Two rules the whole suite follows:
 *
 * - Navigation waits for `domcontentloaded`, never `load`. The layout pulls
 *   Font Awesome from a CDN and the catalogue from `images.unsplash.com`, so
 *   `load` would make every test hostage to a third party. Nothing here asserts
 *   on an image.
 * - Expectations are read from the API and compared against the DOM instead of
 *   being written down twice. A number duplicated in a test only tells you the
 *   seed file changed; a number read from `/api` and compared to the page tells
 *   you the *UI* drifted from the data layer, which is the regression that
 *   matters.
 */

/** On the `top-savers` shelf, so it is reachable from the homepage too. */
export const SAMPLE_PRODUCT_ID = "beef-mince";

/** Every list endpoint wraps its payload in `{ items }` (see `src/lib/api.ts`). */
export async function visit(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Every interaction test needs this; the read-only ones pay ~50ms for it,
  // which is cheaper than a flaky click.
  await ready(page);
}

/**
 * Visit a route that is not a React page — `/docs` serves Swagger UI from a
 * route handler, so there is no `<main>` and nothing to hydrate. Waits for the
 * document instead.
 */
export async function visitDocument(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
}

/**
 * Waits until React has hydrated the element the locator points at.
 *
 * Every page here is a server component that streams, and the interactive bits
 * — the tabs, the stepper, the carousel controls, the search box — only start
 * responding once hydration attaches their handlers. A click that lands in that
 * window is silently swallowed, so the test fails against a perfectly working
 * page. Checking for the `__reactFiber$*` / `__reactProps$*` keys React stamps
 * onto a node during hydration is a direct signal for "this node is now live",
 * as opposed to guessing with a fixed sleep.
 */
export async function hydrated(locator: Locator) {
  await expect
    .poll(
      () =>
        locator.evaluate((node) =>
          Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
        ),
      { message: "waiting for React to hydrate", timeout: 15_000 },
    )
    .toBe(true);
}

/**
 * Waits for the page's React tree to be interactive.
 *
 * `body` carries a `__reactFiber$` key from the very first paint, so the useful
 * signal is `<main>` — it is a server component, and it only gets a fiber once
 * hydration has replaced the streamed markup with a live tree. Prefer this once
 * per page over `hydrated()` on individual controls.
 */
export async function ready(page: Page) {
  await hydrated(page.locator("main"));
}

/** Product links, shared by the shelves, the grid and the related rail. */
export function productLink(page: Page, id: string) {
  return page.locator(`a[href="/product/${id}"]`).first();
}

export function productLinks(page: Page) {
  return page.locator('a[href^="/product/"]');
}

export async function fetchJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(path);
  expect(response.ok(), `GET ${path} should succeed`).toBe(true);
  return (await response.json()) as T;
}

type List<T> = { items: T[] };

export const getCategories = (request: APIRequestContext) =>
  fetchJson<List<CategoryDto>>(request, "/api/categories").then((body) => body.items);

export const getBrands = (request: APIRequestContext) =>
  fetchJson<List<BrandDto>>(request, "/api/brands").then((body) => body.items);

export const getProducts = (request: APIRequestContext, query = "") =>
  fetchJson<ProductPageDto>(request, `/api/products${query}`);

export const getProduct = (request: APIRequestContext, id: string) =>
  fetchJson<ProductDetailDto>(request, `/api/products/${id}`);

export const getShelf = (request: APIRequestContext, shelf: "top-savers" | "best-sellers") =>
  fetchJson<ShelfDto>(request, `/api/shelves/${shelf}`);

/**
 * The count in the "N products" line above the `/search` grid. Reads the first
 * number on the line so a summary suffix ("in Raw Meats") does not break it.
 */
export async function resultTotal(page: Page) {
  const summary = page.getByText(/\d+\s+products?\b/).first();
  const match = /\d+/.exec(await summary.innerText());
  expect(match, "the result summary should render a count").not.toBeNull();
  return Number.parseInt(match![0], 10);
}

/**
 * The `<section>` a carousel belongs to, keyed on the track id.
 *
 * `SectionHeader` titles are plain divs with no role, so they cannot be located
 * by `getByRole("heading")`, and `getByText(title, { exact: true })` does not
 * match either — the div holds the title *plus* the "All Categories >" link, so
 * its accessible text is longer. The track id is the stable handle: it is
 * declared once in the component and is what the tests actually care about.
 */
export function sectionFor(page: Page, trackId: string) {
  return page.locator(`#${trackId}`).locator("xpath=ancestor::section[1]");
}

/** The track itself. */
export function track(page: Page, trackId: string) {
  return page.locator(`#${trackId}`);
}

/** The section title inside a shelf's header row. */
export function sectionTitle(page: Page, trackId: string, title: string) {
  return sectionFor(page, trackId).getByText(title, { exact: true });
}

/**
 * The current `/search` query, decoded.
 *
 * Asserting on a decoded `URLSearchParams` rather than a regex over
 * `page.url()` avoids two traps: `router.push` percent-encodes spaces as `%20`
 * while `URLSearchParams.toString()` writes `+`, and the order of the params is
 * whatever the last control happened to produce.
 */
export function searchParams(page: Page) {
  return new URL(page.url()).searchParams;
}

/**
 * Asserts a `/search` query param, waiting for the client-side navigation to
 * land. `toHaveURL(/\/search\?/)` is not enough on its own — the URL already
 * matches before a `router.push` from a facet link resolves, so reading the
 * param straight afterwards reads the previous page's query.
 */
export function expectSearchParam(page: Page, key: string, value: string | null) {
  return expect
    .poll(() => searchParams(page).get(key), { message: `?${key}=${value}` })
    .toBe(value);
}

/**
 * Product ids inside `container`, in DOM order, de-duplicated.
 *
 * Each card renders two links to the same product (the image and the name), so
 * the hrefs are collapsed. The read also waits for the count to stop changing:
 * `/search` and `/product/[id]` are partial-prerendered, so their grids arrive
 * as server-streamed chunks *after* `domcontentloaded`. Without this, a test
 * that reads too early sees an empty list and fails against a page that is
 * actually fine.
 */
export async function productIdsIn(page: Page, container: string) {
  const read = () =>
    // `:visible` matters: during a client-side navigation the outgoing and
    // incoming pages are both in the DOM, so a bare `main` matches two elements
    // and the read would return the old page's products alongside the new ones.
    page
      .locator(`${container}:visible a[href^="/product/"]`)
      .evaluateAll((nodes) => [
        ...new Set(
          nodes
            .map((node) => node.getAttribute("href")?.replace("/product/", ""))
            .filter(Boolean),
        ),
      ] as string[]);

  // Two consecutive identical reads, and at least one of them after the first.
  // Returning on "length unchanged" alone would report the empty pre-stream DOM
  // as the settled answer, because the first read is taken before the server
  // chunks arrive.
  let previous = await read();
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await page.waitForTimeout(100);
    const current = await read();
    if (attempt > 0 && current.length === previous.length) return current;
    previous = current;
  }
  return previous;
}