import { expect, test } from "@playwright/test";
import { fetchJson } from "./support/app";

/**
 * The JSON API over a real socket.
 *
 * `src/app/api/api.test.ts` already exercises these handlers in-process, so
 * what is left for E2E is the part it structurally cannot see: that the routes
 * are actually mounted, that the response is JSON with the right content type,
 * and that the status codes survive Next's own routing layer. A route renamed
 * out of `app/api/` still passes the in-process suite and fails here.
 */

test.describe("JSON API", () => {
  test("every documented endpoint answers 200 with JSON", async ({ request }) => {
    const endpoints = [
      "/api/hello",
      "/api/openapi",
      "/api/brands",
      "/api/categories",
      "/api/categories/raw-meats/products",
      "/api/products?limit=3",
      "/api/products/beef-mince",
      "/api/products/beef-mince/related?limit=3",
      "/api/shelves/top-savers",
      "/api/shelves/best-sellers",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status(), `GET ${endpoint}`).toBe(200);
      expect(response.headers()["content-type"], `GET ${endpoint}`).toContain("application/json");
      await expect
        .poll(() => response.json().then(() => true, () => false))
        .toBe(true);
    }
  });

  test("/api/openapi documents every mounted route", async ({ request }) => {
    const spec = await fetchJson<{ paths: Record<string, unknown>; openapi: string }>(
      request,
      "/api/openapi",
    );

    expect(spec.openapi).toMatch(/^3\./);
    // `src/lib/openapi.ts` keys paths with the full mount prefix.
    for (const path of Object.keys(spec.paths)) {
      expect(path, `documented path ${path}`).toMatch(/^\/api\//);
    }
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        "/api/hello",
        "/api/products",
        "/api/products/{id}",
        "/api/products/{id}/related",
        "/api/categories",
        "/api/categories/{name}/products",
        "/api/brands",
        "/api/shelves/top-savers",
        "/api/shelves/best-sellers",
      ]),
    );
  });

  test("the spec is reachable from /docs so the two cannot drift apart silently", async ({
    request,
  }) => {
    const spec = await fetchJson<{ paths: Record<string, unknown> }>(request, "/api/openapi");

    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });

  test("an unknown product 404s with the error envelope", async ({ request }) => {
    const response = await request.get("/api/products/nope");

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: 'Product "nope" was not found.' },
    });
  });

  test("an unknown category 404s rather than returning an empty page", async ({ request }) => {
    const response = await request.get("/api/categories/nope/products");

    expect(response.status()).toBe(404);
    expect(await response.json()).toHaveProperty("error.code", "not_found");
  });

  test("a hostile sort param is rejected, not interpolated", async ({ request }) => {
    // Without the allowlist in `pickParam`, `__proto__` reached ORDER BY.
    const response = await request.get("/api/products?sort=__proto__&limit=5");

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ meta: { total: 29 } });
  });

  test("rejects a non-numeric limit instead of returning everything", async ({ request }) => {
    const body = await fetchJson<{ meta: { limit: number }; items: unknown[] }>(
      request,
      "/api/products?limit=abc",
    );

    expect(body.meta.limit).toBe(12);
    expect(body.items).toHaveLength(12);
  });
});