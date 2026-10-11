import { expect, test } from "@playwright/test";
import {
  expectSearchParam,
  getBrands,
  getCategories,
  getShelf,
  productIdsIn,
  sectionFor,
  track,
  visit,
} from "./support/app";

/**
 * Homepage regression.
 *
 * The four shelves are Suspense boundaries around a synchronous SQLite read, so
 * the failure this file exists to catch is a shelf silently resolving to
 * nothing — which, per the diagnostics in AGENTS.md, renders an empty row of
 * cards with no error anywhere. Every shelf is therefore checked against the
 * API that reads the same rows, not against a hardcoded count.
 */

const CATEGORIES = "categories-track";
const BRANDS = "brands-track";
const TOP_SAVERS = "top-savers-track";
const BEST_SELLERS = "best-sellers-track";

test.describe("homepage", () => {
  test("renders the storefront chrome", async ({ page }) => {
    await visit(page, "/");

    await expect(page).toHaveTitle(/Farmart/);
    // The logo link's accessible name carries the Font Awesome glyph as well as
    // the word, so match on the text rather than an exact name.
    await expect(page.getByRole("banner").getByRole("link", { name: /Farmart/ })).toBeVisible();
    await expect(page.getByText("8 800 332 65-66")).toBeVisible();
    await expect(page.getByText("Your Cart")).toBeVisible();
    await expect(page.getByText("SHOP BY CATEGORY")).toBeVisible();

    // A pruned session must still land on a real page, not on the not-found UI.
    await expect(page.locator("main")).toBeVisible();
  });

  test("renders the hero", async ({ page }) => {
    await visit(page, "/");

    await expect(
      page.getByRole("heading", { name: "Active Summer With Juice Milk 300ml" }),
    ).toBeVisible();
    await expect(page.getByText("20% SALE OFF")).toBeVisible();
  });

  test("Browse by Category lists every category and links into /search", async ({
    page,
    request,
  }) => {
    const categories = await getCategories(request);
    await visit(page, "/");

    await expect(track(page, CATEGORIES).locator("> li")).toHaveCount(categories.length);

    // The tile text is authored as two lines ("Fruits &" / "Vegetables") and
    // rendered as two blocks, so `lines.join(" ")` does not match the DOM text.
    // The href is unambiguous — it is the label, encoded.
    const [first] = categories;
    const tile = track(page, CATEGORIES).locator(
      `a[href="/search?category=${encodeURIComponent(first.label)}"]`,
    );
    await expect(tile).toHaveCount(1);
    for (const line of first.lines) {
      await expect(tile).toContainText(line);
    }
    await expect(tile).toContainText(`${first.productCount} products`);
  });

  test("Browse by Category counts match the catalogue", async ({ page, request }) => {
    const categories = await getCategories(request);
    await visit(page, "/");

    // `productCount` is denormalised onto the category row; if that query and
    // the products table ever disagree, this is where it shows.
    const items = track(page, CATEGORIES).locator("> li");
    for (const category of categories) {
      await expect(
        items.locator(`a[href="/search?category=${encodeURIComponent(category.label)}"]`),
      ).toContainText(`${category.productCount} products`);
    }
  });

  test("Featured Brands renders every promo brand", async ({ page, request }) => {
    const brands = await getBrands(request);
    await visit(page, "/");

    await expect(track(page, BRANDS).locator("> li")).toHaveCount(brands.length);
    for (const brand of brands) {
      await expect(track(page, BRANDS)).toContainText(brand.title);
      await expect(track(page, BRANDS)).toContainText(brand.tag);
    }
  });

  test("Top Saver Today renders the shelf, the countdown and the signup form", async ({
    page,
    request,
  }) => {
    const shelf = await getShelf(request, "top-savers");
    await visit(page, "/");

    await expect(track(page, TOP_SAVERS).locator("> li")).toHaveCount(shelf.items.length);

    // The countdown is a hardcoded placeholder — the point is that the pill is
    // still rendered and still wired into the header row.
    await expect(sectionFor(page, TOP_SAVERS).getByText(/Expires in:/)).toBeVisible();
    await expect(page.getByText("15% OFF")).toBeVisible();
    await expect(page.getByPlaceholder("yourdetail@gmail.com")).toBeVisible();
    await expect(page.getByPlaceholder("Set Your Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Register Now" })).toBeVisible();
  });

  test("Best Seller renders the shelf and its category tabs", async ({ page, request }) => {
    const shelf = await getShelf(request, "best-sellers");
    await visit(page, "/");

    await expect(track(page, BEST_SELLERS).locator("> li")).toHaveCount(shelf.items.length);
    for (const filter of shelf.filters ?? []) {
      await expect(sectionFor(page, BEST_SELLERS).getByRole("link", { name: filter, exact: true })).toBeVisible();
    }
  });

  test("a Best Seller tab navigates to the matching /search filter", async ({ page }) => {
    await visit(page, "/");

    await sectionFor(page, BEST_SELLERS)
      .getByRole("link", { name: "Frozen Seafoods", exact: true })
      .click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Frozen Seafoods");
  });

  test("shelves show the same products the API returns", async ({ page, request }) => {
    const topSavers = await getShelf(request, "top-savers");
    const bestSellers = await getShelf(request, "best-sellers");
    await visit(page, "/");

    expect(await productIdsIn(page, `#${TOP_SAVERS}`)).toEqual(topSavers.items.map((item) => item.id));
    expect(await productIdsIn(page, `#${BEST_SELLERS}`)).toEqual(
      bestSellers.items.map((item) => item.id),
    );
  });

  test("a carousel control scrolls its own track", async ({ page }) => {
    await visit(page, "/");

    const list = track(page, TOP_SAVERS);
    expect(await list.evaluate((node) => node.scrollLeft)).toBe(0);

    await sectionFor(page, TOP_SAVERS).getByRole("button", { name: "Next" }).click();

    // Smooth scrolling, so poll rather than read once.
    await expect
      .poll(() => list.evaluate((node) => node.scrollLeft), { timeout: 5_000 })
      .toBeGreaterThan(0);
  });

  test("shows the carousel controls on a desktop viewport", async ({ page }) => {
    await visit(page, "/");

    // `CarouselControls` is `max-md:hidden`: the shelf scrolls by drag at phone
    // widths, so the buttons are redundant there and hidden. The mirror of this
    // assertion runs in the mobile project.
    await expect(
      sectionFor(page, TOP_SAVERS).getByRole("button", { name: "Next" }),
    ).toBeVisible();
  });

  test("@responsive hides the carousel controls on a phone viewport", async ({ page }) => {
    await visit(page, "/");

    await expect(
      sectionFor(page, TOP_SAVERS).getByRole("button", { name: "Next" }),
    ).toBeHidden();
  });
});