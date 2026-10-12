import { expect, test, type Page } from "@playwright/test";
import {
  categoryPicker,
  expectSearchParam,
  getProducts,
  hydrated,
  productIdsIn,
  resultTotal,
  searchBox,
  visit,
} from "./support/app";

/**
 * `/search` regression.
 *
 * Every filter lives in the URL, so the interesting failures are all in the
 * round trip: a control that forgets to write its param, a param the query
 * layer ignores, or a filter change that does not reset the page number. Each
 * spec below therefore asserts the URL *and* the resulting ids, with the ids
 * compared against `/api/products` so a UI/query mismatch fails here.
 */

/** `/search` pages 12 at a time. */
const PER_PAGE = 12;

test.describe("/search", () => {
  test("lists the whole catalogue on first load", async ({ page, request }) => {
    const { meta } = await getProducts(request, "?limit=1");
    await visit(page, "/search");

    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    expect(await resultTotal(page)).toBe(meta.total);
    expect(await productIdsIn(page, "main")).toHaveLength(Math.min(PER_PAGE, meta.total));
  });

  test("submitting the header search box navigates with the term", async ({ page }) => {
    await visit(page, "/");

    await page.getByLabel("Search products").fill("beef");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "q", "beef");
    await expect(page.getByRole("heading", { name: "Search: beef" })).toBeVisible();
    expect(await productIdsIn(page, "main")).not.toHaveLength(0);
  });

  test("the category dropdown filters as soon as it changes", async ({ page, request }) => {
    await visit(page, "/");
    await page.getByLabel("Category").selectOption("Raw Meats");

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Raw Meats");

    const expected = await getProducts(request, "?category=Raw%20Meats&limit=50");

    // Wait for the destination page, not just the URL. `router.push` updates the
    // address bar before the new document's grid streams in, and `main` still
    // holds the homepage's shelves at that point — reading ids then returns the
    // Top Saver and Best Seller products, which is what this assertion catches.
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Search");
    await expect.poll(() => productIdsIn(page, "main")).toEqual(
      expected.items.map((item) => item.id),
    );
  });

  test("a term search matches what the API returns", async ({ page, request }) => {
    const expected = await getProducts(request, "?q=beef");
    await visit(page, "/search?q=beef");

    expect(await resultTotal(page)).toBe(expected.meta.total);
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
    await expect(page.getByText(/results for “beef”/)).toBeVisible();
  });

  test("shows the empty state instead of a blank grid", async ({ page }) => {
    await visit(page, "/search?q=nothingmatchesthis");

    await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
    await expect(page.locator('a[href^="/product/"]')).toHaveCount(0);
    // No pagination to show when there is nothing to page through.
    await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);
  });

  test("category facets narrow the grid and survive the round trip", async ({ page, request }) => {
    await visit(page, "/search");

    await page.locator("aside").getByRole("link", { name: /Raw Meats/ }).click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Raw Meats");

    const expected = await getProducts(request, "?category=Raw%20Meats");
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("a brand facet composes with the active category", async ({ page, request }) => {
    await visit(page, "/search?category=Raw%20Meats");
    await page.locator("aside").getByRole("link", { name: /Meat Brand/ }).click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Raw Meats");
    await expectSearchParam(page, "brand", "Meat Brand");

    const expected = await getProducts(request, "?category=Raw%20Meats&brand=Meat%20Brand");
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("Clear all filters drops every param", async ({ page }) => {
    await visit(page, "/search?q=beef&category=Raw%20Meats&onSale=true");

    await page.getByRole("link", { name: "Clear all filters" }).click();

    await expect(page).toHaveURL("/search");
    await expect(page.getByRole("link", { name: "Clear all filters" })).toHaveCount(0);
  });

  test("sorting writes the param and reorders the grid", async ({ page, request }) => {
    const expected = await getProducts(request, "?sort=price_asc");
    await visit(page, "/search");

    await page.getByLabel("Sort by").selectOption("price_asc");

    await expect(page).toHaveURL(/sort=price_asc/);
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("an unknown sort value falls back to the default ordering", async ({ page, request }) => {
    // Regression: `?sort=sideways` used to reach ORDER BY unguarded. The <select>
    // is controlled, so a rejected value must still render a real option.
    const expected = await getProducts(request);
    await visit(page, "/search?sort=sideways");

    await expect(page.getByLabel("Sort by")).toHaveValue("best_selling");
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("the On sale toggle is a pressed-state button that filters", async ({ page, request }) => {
    const expected = await getProducts(request, "?onSale=true");
    await visit(page, "/search");

    const toggle = page.getByRole("button", { name: "On sale only" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();

    await expect(page).toHaveURL(/onSale=true/);
    await expect(page.getByRole("button", { name: "On sale only" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("paginates and marks the current page", async ({ page, request }) => {
    const second = await getProducts(request, "?page=2");
    await visit(page, "/search");

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination).toBeVisible();
    await expect(pagination.getByRole("link", { name: "1", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await pagination.getByRole("link", { name: "2", exact: true }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(pagination.getByRole("link", { name: "2", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await productIdsIn(page, "main")).toEqual(second.items.map((item) => item.id));
  });

  test("changing a filter resets the page number", async ({ page }) => {
    await visit(page, "/search?page=3");

    await page.getByRole("button", { name: "On sale only" }).click();

    // Regression: page 3 of a filtered set is almost always empty, so the
    // controls clear `page` whenever anything else changes.
    await expect(page).toHaveURL(/onSale=true/);
    await expectSearchParam(page, "page", null);
  });

  test("clicking a facet link also resets the page number", async ({ page }) => {
    await visit(page, "/search?page=3");

    await page.locator("aside").getByRole("link", { name: /Raw Meats/ }).click();

    // The facet links go through `href()` in search-results, a different helper
    // from the one the toggle and sort controls use. Both have to clear `page`,
    // and a regression in either one is invisible to the other path.
    await expectSearchParam(page, "category", "Raw Meats");
    await expectSearchParam(page, "page", null);
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });

  test("paging preserves the other filters", async ({ page }) => {
    // `?onSale=true` alone leaves only 10 products, which is one page — the
    // pagination link would not exist. `sort` travels alongside `page` on the
    // unfiltered catalogue, which is where the OFFSET actually moves.
    await visit(page, "/search?sort=price_asc&page=1");

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await pagination.getByRole("link", { name: "2", exact: true }).click();

    await expectSearchParam(page, "page", "2");
    await expectSearchParam(page, "sort", "price_asc");
  });

  test("a page number past the end renders without erroring", async ({ page }) => {
    await visit(page, "/search?page=999");

    await expect(page.locator("main")).toBeVisible();
    await expect(
      page
        .getByRole("heading", { name: "No products found" })
        .or(page.locator('a[href^="/product/"]').first()),
    ).toBeVisible();
  });

  test("filters are combined in the URL as well as in the query", async ({ page, request }) => {
    await visit(page, "/search?category=Raw%20Meats&onSale=true&sort=price_asc");

    await expect(page.getByRole("button", { name: "On sale only" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByLabel("Sort by")).toHaveValue("price_asc");

    const expected = await getProducts(request, "?category=Raw%20Meats&onSale=true&sort=price_asc");
    expect(await productIdsIn(page, "main")).toEqual(expected.items.map((item) => item.id));
  });

  test("a product card navigates to its detail page", async ({ page }) => {
    await visit(page, "/search?q=beef");

    const card = page.locator('a[href^="/product/"]').first();
    const id = (await card.getAttribute("href"))!.replace("/product/", "");
    await card.click();

    await expect(page).toHaveURL(new RegExp(`/product/${id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("@responsive stacks the facets above the grid", async ({ page }) => {
    await visit(page, "/search?q=beef");

    // `lg:grid-cols-[220px_1fr]` collapses to one column, so the aside sits
    // above the results instead of beside them.
    const aside = page.locator("aside");
    await expect(aside).toBeVisible();
    const [asideBox, cardBox] = await Promise.all([
      aside.boundingBox(),
      page.locator('a[href^="/product/"]').first().boundingBox(),
    ]);
    expect(asideBox!.y).toBeLessThan(cardBox!.y);
  });
});

/**
 * Typeahead in the header search box.
 *
 * The dropdown runs the same FTS5 query as `/api/products` through a server
 * action, capped at three rows. Every expectation here is read from the API and
 * compared against the listbox, so a divergence between the two surfaces — the
 * thing that would actually be wrong — fails rather than passing on both sides
 * drifting together.
 */
test.describe("header search suggestions", () => {
  // `milk` matches five products, so every run of these specs exercises the
  // three-row cap and the "N results" footer rather than a list that happens to
  // fit.
  const TERM = "milk";
  const CAP = 3;

  const listbox = (page: Page) => page.getByRole("listbox", { name: "Search suggestions" });
  const options = (page: Page) => listbox(page).getByRole("option");
  const optionIds = (page: Page) =>
    options(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-product-id")));

  /** Types into the header box and waits for the dropdown to settle. */
  async function type(page: Page, term: string) {
    await searchBox(page).fill(term);
    await expect(listbox(page)).toBeVisible();
  }

  test("lists the top matches for the typed term, capped at three", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&limit=${CAP}`);
    expect(expected.meta.total).toBeGreaterThan(CAP);

    await visit(page, "/");
    await type(page, TERM);

    await expect(options(page)).toHaveCount(CAP);
    // Ids rather than text: the row also carries the brand and the price, and
    // those are the API's business, not this test's.
    await expect.poll(() => optionIds(page)).toEqual(expected.items.map((item) => item.id));
  });

  test("a row shows the product's brand, name and price", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&limit=${CAP}`);

    await visit(page, "/");
    await type(page, TERM);

    const first = expected.items[0];
    const row = options(page).first();
    await expect(row).toContainText(first.brand);
    await expect(row).toContainText(first.name);
    await expect(row).toContainText(first.price);
  });

  test("the footer counts every match, not just the rows shown", async ({ page, request }) => {
    const { meta } = await getProducts(request, `?q=${TERM}&limit=${CAP}`);
    const shown = Math.min(CAP, meta.total);

    await visit(page, "/");
    await type(page, TERM);

    await expect(
      page.getByRole("button", { name: `See all ${meta.total} results for \u201c${TERM}\u201d` }),
    ).toBeVisible();
    await expect(page.getByText(`+${meta.total - shown} more`)).toBeVisible();
  });

  test("clicking a suggestion searches for that product's name", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&limit=${CAP}`);
    await visit(page, "/");
    await type(page, TERM);

    const name = expected.items[0].name;
    await options(page).first().click();

    // Filling the box rather than jumping to the detail page: the shopper picks
    // a product to compare, not one to buy.
    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "q", name);
    await expect(searchBox(page)).toHaveValue(name);
    await expect(listbox(page)).toHaveCount(0);
  });

  test("the footer runs the search for the typed term", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}`);
    await visit(page, "/");
    await type(page, TERM);

    await page.getByRole("button", { name: /See all \d+ results/ }).click();

    await expectSearchParam(page, "q", TERM);
    // `expect.poll`, not a single read: the click navigates away from the
    // homepage, and until the outgoing page unmounts `main:visible` matches both
    // and returns the homepage's shelves alongside the new results.
    await expect.poll(() => productIdsIn(page, "main")).toEqual(
      expected.items.map((item) => item.id),
    );
  });

  test("arrow keys move the highlight and Enter picks the row", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&limit=${CAP}`);
    await visit(page, "/");
    await type(page, TERM);

    await expect(searchBox(page)).toHaveAttribute("aria-expanded", "true");

    await searchBox(page).press("ArrowDown");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");

    await searchBox(page).press("ArrowDown");
    await expect(options(page).nth(1)).toHaveAttribute("aria-selected", "true");

    await searchBox(page).press("Enter");
    await expectSearchParam(page, "q", expected.items[1].name);
  });

  test("the highlight wraps around and is reachable by id", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&limit=${CAP}`);
    await visit(page, "/");
    await type(page, TERM);

    await searchBox(page).press("ArrowUp");
    // `aria-activedescendant` is how a combobox points at its active row without
    // moving focus, so it has to name the id the option actually carries.
    const active = await searchBox(page).getAttribute("aria-activedescendant");
    await expect(options(page).nth(CAP - 1)).toHaveAttribute("id", active!);
    await expect(options(page).nth(CAP - 1)).toHaveAttribute("aria-selected", "true");
    expect(active).not.toBeNull();

    await searchBox(page).press("Enter");
    await expectSearchParam(page, "q", expected.items[CAP - 1].name);
  });

  test("Escape closes the list and keeps the term", async ({ page }) => {
    await visit(page, "/");
    await type(page, TERM);

    await searchBox(page).press("Escape");

    // Regression risk: `<input type="search">` clears itself on Escape as a
    // browser default, so the handler has to preventDefault to keep the term.
    await expect(listbox(page)).toHaveCount(0);
    await expect(searchBox(page)).toHaveValue(TERM);
  });

  test("a term too short to be selective shows nothing", async ({ page }) => {
    await visit(page, "/");
    await searchBox(page).fill("m");

    // Nothing to wait for: the point is that no query runs at all.
    await page.waitForTimeout(500);
    await expect(listbox(page)).toHaveCount(0);
  });

  test("a term with no matches says so instead of an empty box", async ({ page }) => {
    await visit(page, "/");
    await searchBox(page).fill("nothingmatchesthis");

    await expect(page.getByText("No matching products")).toBeVisible();
    await expect(options(page)).toHaveCount(0);
  });

  test("the chosen category narrows the suggestions", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}&category=Raw%20Meats&limit=${CAP}`);
    await visit(page, "/");
    await categoryPicker(page).selectOption("Raw Meats");
    await expectSearchParam(page, "category", "Raw Meats");
    // The picker navigates, so the destination header is a new component with a
    // debounce effect that has not started until it hydrates — a `fill` before
    // then is silently swallowed.
    await hydrated(searchBox(page));

    await type(page, TERM);

    await expect.poll(() => optionIds(page)).toEqual(expected.items.map((item) => item.id));
  });

  test("the box still searches for the typed term with no highlight", async ({ page, request }) => {
    const expected = await getProducts(request, `?q=${TERM}`);
    await visit(page, "/");
    await type(page, TERM);

    await page.getByRole("button", { name: "Search" }).click();

    // Enter or the magnifier with nothing highlighted searches the box verbatim.
    await expectSearchParam(page, "q", TERM);
    await expect.poll(() => productIdsIn(page, "main")).toEqual(
      expected.items.map((item) => item.id),
    );
  });
});
