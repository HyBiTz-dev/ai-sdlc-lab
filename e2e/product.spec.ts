import { expect, test, type Page } from "@playwright/test";
import { formatPrice } from "../src/lib/format";
import { fetchJson, getProduct, productIdsIn, visit } from "./support/app";

/**
 * `/product/[id]` regression.
 *
 * This route opts out of the static shell (`instant = false`) because it has to
 * know whether the product exists before committing a response, and it is the
 * one page that calls `notFound()`. Both are the kind of thing that only shows
 * up in a build, which is why the suite runs against `next start`.
 */

const PRODUCT_ID = "beef-mince";

/**
 * The buy panel, not every "Add To Cart" on the page. The related shelf renders
 * six product cards, each with its own inert button of the same name.
 *
 * Scoped from the quantity stepper, which is the one control unique to the
 * panel. Its parent chain reaches the whole panel in two hops: the stepper is
 * `<div>` inside the flex row that also holds Add To Cart, and that row's parent
 * holds the line total.
 */
function buyPanel(page: Page) {
  return page.getByRole("button", { name: "Increase quantity" }).locator("xpath=../../..");
}

test.describe("product detail", () => {
  test("renders the copy, price and stock line from the API", async ({ page, request }) => {
    const product = await getProduct(request, PRODUCT_ID);
    await visit(page, `/product/${PRODUCT_ID}`);

    await expect(page).toHaveTitle(`${product.name} - Farmart`);
    await expect(page.getByRole("heading", { level: 1, name: product.name })).toBeVisible();
    await expect(page.getByText(`SKU: ${product.sku}`)).toBeVisible();
    await expect(page.getByText(`${product.reviewCount} verified reviews`)).toBeVisible();

    if (product.sold !== undefined && product.total !== undefined) {
      const sold = String(product.sold).padStart(2, "0");
      const total = String(product.total).padStart(2, "0");
      await expect(page.getByText(`Sold: ${sold}/${total}`)).toBeVisible();
      await expect(page.getByText("In stock")).toBeVisible();
    }
  });

  test("the breadcrumb walks category then product", async ({ page, request }) => {
    const product = await getProduct(request, PRODUCT_ID);
    await visit(page, `/product/${PRODUCT_ID}`);

    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(crumbs.getByRole("link", { name: product.category!, exact: true })).toHaveAttribute(
      "href",
      `/search?category=${encodeURIComponent(product.category!)}`,
    );
    // The last crumb is the current page, so it is text and never a link.
    await expect(crumbs.getByText(product.name, { exact: true })).toBeVisible();
    await expect(crumbs.getByRole("link", { name: product.name })).toHaveCount(0);
  });

  test("the description tab is the default and lists the highlights", async ({
    page,
    request,
  }) => {
    const product = await getProduct(request, PRODUCT_ID);
    await visit(page, `/product/${PRODUCT_ID}`);

    await expect(page.getByText(product.description!)).toBeVisible();
    for (const highlight of product.highlights ?? []) {
      await expect(page.getByText(highlight, { exact: true })).toBeVisible();
    }
  });

  test("the specs tab shows the spec rows and the SKU", async ({ page, request }) => {
    const product = await getProduct(request, PRODUCT_ID);
    await visit(page, `/product/${PRODUCT_ID}`);

    await page.getByRole("button", { name: "Specifications" }).click();

    // Scoped to the <dl>: spec values like "500g" or "20%" also appear in the
    // copy above the panel, so a page-wide lookup would be ambiguous.
    const list = page.locator("dl");
    for (const spec of product.specs ?? []) {
      await expect(list.getByText(spec.label, { exact: true })).toBeVisible();
      await expect(list.getByText(spec.value, { exact: true })).toBeVisible();
    }
    // The two rows the panel appends beyond the seeded spec list.
    await expect(list.getByText("SKU", { exact: true })).toBeVisible();
    await expect(list.getByText("Pack Size", { exact: true })).toBeVisible();
    // The description panel is unmounted while another tab is active.
    await expect(page.getByText(product.description!)).toHaveCount(0);
  });

  test("the shipping tab swaps the panel content", async ({ page }) => {
    await visit(page, `/product/${PRODUCT_ID}`);

    await page.getByRole("button", { name: "Shipping & Returns" }).click();

    // The tab strip is the first child of the card; the panel is its next
    // sibling. Scoped this way the shipping copy cannot be confused with the
    // "Free delivery over $50" trust line in the header block above.
    const panel = page
      .getByRole("button", { name: "Description" })
      .locator("xpath=../..")
      .locator("> div")
      .nth(1);
    await expect(panel.getByText(/Free delivery on orders over \$50/)).toBeVisible();
    await expect(panel.getByText(/7-day returns on unopened items/)).toBeVisible();
  });

  test("the quantity stepper recomputes the line total and clamps at the ends", async ({
    page,
    request,
  }) => {
    const product = await getProduct(request, PRODUCT_ID);
    await visit(page, `/product/${PRODUCT_ID}`);

    const quantity = page.locator("[aria-live='polite']");
    // Scoped to the panel: the unit price also appears in the headline price
    // row above, so an unscoped lookup for `$4.75` is ambiguous at quantity 1.
    const lineTotal = (multiple: number) =>
      buyPanel(page).getByText(formatPrice(product.priceValue * multiple), { exact: true });

    await expect(quantity).toHaveText("1");
    // At 1 the decrement button is disabled; going below it must be impossible.
    await expect(page.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await expect(lineTotal(1)).toBeVisible();

    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(quantity).toHaveText("2");
    await expect(page.getByText(`2 × ${product.price}`, { exact: true })).toBeVisible();
    await expect(lineTotal(2)).toBeVisible();
    await expect(lineTotal(1)).toHaveCount(0);

    await page.getByRole("button", { name: "Decrease quantity" }).click();
    await expect(quantity).toHaveText("1");
    await expect(page.getByText(`1 × ${product.price}`, { exact: true })).toBeVisible();
    await expect(lineTotal(1)).toBeVisible();
  });

  test("Add To Cart confirms locally without leaving the page", async ({ page }) => {
    await visit(page, `/product/${PRODUCT_ID}`);

    await buyPanel(page).getByRole("button", { name: "Add To Cart" }).click();

    await expect(buyPanel(page).getByRole("button", { name: /Added To Cart/ })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/product/${PRODUCT_ID}$`));
  });

  test("the related shelf excludes the product itself", async ({ page, request }) => {
    const related = await fetchJson<{ id: string; items: { id: string }[] }>(
      request,
      `/api/products/${PRODUCT_ID}/related`,
    );
    await visit(page, `/product/${PRODUCT_ID}`);

    await expect(page.locator("#related-track > li")).toHaveCount(related.items.length);
    expect(await productIdsIn(page, "#related-track")).toEqual(related.items.map((item) => item.id));
    expect(related.items.some((item) => item.id === PRODUCT_ID)).toBe(false);
  });

  test("an unknown id renders the not-found UI", async ({ page }) => {
    // Deliberately not `visit()`: this page has no `<main>` from the storefront
    // shell, so there is nothing to wait on hydration for.
    const response = await page.goto("/product/does-not-exist", {
      waitUntil: "domcontentloaded",
    });

    // AGENTS.md: `notFound()` cannot set a 404 under Partial Prerendering — the
    // shell is flushed with 200 before the lookup finishes. Pin the *UI*, and
    // assert the status separately so the framework limitation is not "fixed" by
    // editing the wrong assertion.
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
    expect(response?.status(), "PPR cannot defer the status code yet").toBe(200);
  });

  test("@responsive keeps the buy panel below the gallery", async ({ page }) => {
    await visit(page, `/product/${PRODUCT_ID}`);

    const addToCart = buyPanel(page).getByRole("button", { name: "Add To Cart" });
    const heading = page.getByRole("heading", { level: 1 });

    await expect(addToCart).toBeVisible();
    const [panelBox, headingBox] = await Promise.all([
      addToCart.boundingBox(),
      heading.boundingBox(),
    ]);
    expect(panelBox!.y).toBeGreaterThan(headingBox!.y);
  });
});