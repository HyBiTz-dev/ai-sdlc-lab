import { expect, test } from "@playwright/test";
import { expectSearchParam, productLink, track, visit, visitDocument } from "./support/app";

/**
 * Cross-page journeys plus the dev-tool pages.
 *
 * These are the paths that break when a route changes shape or a `Link` loses
 * its `href`: no single page looks broken, the path between them does.
 */

const RELATED = "related-track";

test.describe("navigation", () => {
  test("homepage card → detail page → related card", async ({ page }) => {
    await visit(page, "/");

    await productLink(page, "beef-mince").click();
    await expect(page).toHaveURL(/\/product\/beef-mince$/);

    // Follow a recommendation, which proves the related rail rendered real ids.
    await track(page, RELATED).locator('a[href^="/product/"]').first().click();
    await expect(page).toHaveURL(/\/product\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("breadcrumb returns to the category from a detail page", async ({ page }) => {
    await visit(page, "/product/beef-mince");

    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Raw Meats" })
      .click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Raw Meats");
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });

  test("category tile → search results", async ({ page }) => {
    await visit(page, "/");

    await track(page, "categories-track")
      .locator('a[href="/search?category=Fruits%20%26%20Vegetables"]')
      .click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "category", "Fruits & Vegetables");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
  });

  test("Top Saver 'All Offers' lands on the discounted, cheapest-first list", async ({ page }) => {
    await visit(page, "/");

    await page
      .locator("#top-savers-track")
      .locator("xpath=preceding-sibling::div[1]")
      .getByRole("link", { name: /All Offers/ })
      .click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "onSale", "true");
    await expectSearchParam(page, "sort", "price_asc");
    await expect(page.getByRole("button", { name: "On sale only" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("the search box is present on every storefront page", async ({ page }) => {
    for (const path of ["/", "/search", "/product/beef-mince"]) {
      await visit(page, path);
      await expect(page.getByRole("search")).toBeVisible();
      await expect(page.getByLabel("Search products")).toBeVisible();
    }
  });
});

test.describe("dev-tool pages", () => {
  test("/design renders the token catalog", async ({ page }) => {
    await visit(page, "/design");

    // `Section` titles are divs, not headings — the ids come from the `nav`
    // array in the page, which is what the anchor links resolve against too.
    await expect(page.locator("#principles")).toBeVisible();
    await expect(page.locator("#colors")).toBeVisible();
    await expect(page.locator("#typography")).toBeVisible();
    await expect(page.locator("#components")).toBeVisible();

    // Every nav entry must resolve to a section that exists, or the anchor
    // links at the top of the page scroll nowhere.
    const anchors = page.locator('a[href^="#"]');
    const targets = await anchors.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href")),
    );
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      await expect(page.locator(target!)).toHaveCount(1);
    }
  });

  test("/design mirrors the token colours from design-tokens.ts", async ({ page }) => {
    await visit(page, "/design");

    // `#f5a623` is `{colors.primary}`; the page renders it from the token file
    // rather than from a copy, so a token edit shows up here immediately.
    await expect(page.locator("#colors")).toContainText("#f5a623");
  });

  test("/mermaid serves the ER diagram built from the live schema", async ({ page }) => {
    await visit(page, "/mermaid");

    await expect(page.getByRole("heading", { name: "Database Schema" })).toBeVisible();

    // The source is generated server-side from `PRAGMA table_info` and rendered
    // in the "Mermaid Code" tab, so this reads the same string the diagram is
    // drawn from. The tab is a client toggle; the default view renders the SVG
    // from a CDN ES module, which this suite deliberately does not wait on.
    await page.getByRole("tab", { name: "Mermaid Code" }).click();

    const source = page.locator("pre");
    await expect(source).toContainText("erDiagram");
    // Tables come from `PRAGMA table_info` at build time, so a column added in a
    // migration shows up here without touching this test.
    await expect(source).toContainText("product_specs");
    await expect(source).toContainText("product_shelves");

    // FTS5 keeps its index in shadow tables named `<fts_table>_<suffix>`. Those
    // are filtered out (`FTS_SHADOW_SUFFIX` in `src/lib/mermaid.ts`) because they
    // are an implementation detail of `sqlite_master`, not part of the model —
    // but the `products_fts` virtual table itself is a real entry and stays.
    await expect(source).not.toContainText("products_fts_data");
    await expect(source).not.toContainText("products_fts_idx");
    await expect(source).not.toContainText("products_fts_content");
  });

  test("/tests renders the coverage report or its empty state", async ({ page }) => {
    await visit(page, "/tests");

    await expect(page.getByRole("heading", { name: /Test Report/ })).toBeVisible();
    // Coverage is read from coverage/coverage-summary.json, which is not
    // committed, and the reader also tolerates a truncated file. Both states
    // are valid renders; a crash is not.
    await expect(page.locator("body")).toContainText("%");
  });

  test("dev pages cross-link to each other", async ({ page }) => {
    await visit(page, "/mermaid");

    await page.getByRole("link", { name: "Design" }).click();
    await expect(page).toHaveURL(/\/design$/);
  });

  test("/docs serves Swagger UI for the spec", async ({ page }) => {
    await visitDocument(page, "/docs");

    // Swagger UI mounts into an empty div from a CDN bundle, so the stable
    // assertion is the mount point and the document's own title — not the
    // rendered operation list, which needs the CDN script.
    await expect(page).toHaveTitle(/Swagger/i);
    await expect(page.locator("#swagger-ui")).toBeAttached();
  });
});

test.describe("accessible names", () => {
  test("every product image is named", async ({ page }) => {
    await visit(page, "/search");

    const unnamed = await page
      .locator('a[href^="/product/"] img')
      .evaluateAll((nodes) => nodes.filter((node) => !node.getAttribute("alt")).length);
    expect(unnamed).toBe(0);
  });

  test("the search form is reachable by role, not by placeholder", async ({ page }) => {
    await visit(page, "/");

    await page.getByRole("search").getByLabel("Search products").fill("chocolate");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?/);
    await expectSearchParam(page, "q", "chocolate");
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });
});