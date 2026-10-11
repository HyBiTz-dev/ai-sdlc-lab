import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as hello } from "@/app/api/hello/route";
import { GET as brands } from "@/app/api/brands/route";
import { GET as categories } from "@/app/api/categories/route";
import { GET as categoryProducts } from "@/app/api/categories/[name]/products/route";
import { GET as products } from "@/app/api/products/route";
import { GET as product } from "@/app/api/products/[id]/route";
import { GET as related } from "@/app/api/products/[id]/related/route";
import { GET as bestSellers } from "@/app/api/shelves/best-sellers/route";
import { GET as topSavers } from "@/app/api/shelves/top-savers/route";
import { GET as openapi } from "@/app/api/openapi/route";
import { openApiSpec } from "@/lib/openapi";

/**
 * Route handlers invoked directly. This exercises the real query layer and the
 * real serialisers, so it catches a mismatch between what `queries.ts` returns
 * and what the wire format promises — without needing a listening server.
 */

const ORIGIN = "http://localhost:3000";

function request(path: string) {
  return new NextRequest(`${ORIGIN}${path}`);
}

/** Route handlers may be sync or async, and they answer with a `NextResponse`. */
async function json(response: Response | Promise<Response>) {
  return (await (await response).json()) as Record<string, unknown>;
}

/** Same, for tests that only need the status. */
async function status(response: Response | Promise<Response>) {
  return (await response).status;
}

describe("GET /api/hello", () => {
  it("answers with the greeting", async () => {
    const response = hello();
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ message: "Hello World!" });
  });
});

describe("GET /api/products", () => {
  it("returns a page of products with meta and facets", async () => {
    const body = await json(products(request("/api/products?limit=5")));

    expect((body.items as unknown[]).length).toBe(5);
    expect(body.meta).toEqual({ page: 1, limit: 5, total: 29, totalPages: 6 });
    expect(body.facets).toHaveProperty("categories");
    expect(body.facets).toHaveProperty("brands");
  });

  it("applies every documented filter", async () => {
    const body = await json(
      products(request("/api/products?q=beef&category=Raw%20Meats&onSale=true")),
    );
    const items = body.items as { id: string; category: string }[];

    // Both beef products are discounted and in Raw Meats.
    expect(body.meta).toMatchObject({ total: 2 });
    expect(items.map((item) => item.id).sort()).toEqual(["beef-mince", "british-beef"]);
    expect(items.every((item) => item.category === "Raw Meats")).toBe(true);
  });

  it("narrows further with a brand", async () => {
    const body = await json(
      products(request("/api/products?q=beef&category=Raw%20Meats&brand=Meat%20Brand")),
    );

    expect(body.meta).toMatchObject({ total: 1 });
    expect((body.items as { id: string }[])[0].id).toBe("beef-mince");
  });

  it("defaults limit to 12 and ignores an unknown sort value", async () => {
    const body = await json(products(request("/api/products?sort=sideways")));

    expect(body.meta).toMatchObject({ limit: 12 });
    // Falls back to best_selling rather than erroring.
    expect(body.meta).toMatchObject({ total: 29 });
  });

  it("returns 200 with an empty list when nothing matches", async () => {
    const response = products(request("/api/products?q=nothingmatchesthis"));
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });

  it("ignores a sort value it has no ORDER BY clause for", async () => {
    // `pickParam` allowlists sort; without it an inherited Object.prototype
    // key reached ORDER BY as a function body and threw a SqliteError.
    const response = products(request("/api/products?sort=__proto__"));

    expect(response.status).toBe(200);
    expect((await json(response)).items).toHaveLength(12);
  });

  it("never leaks undefined values as null", async () => {
    const body = await json(products(request("/api/products?limit=50")));
    const items = body.items as Record<string, unknown>[];

    // `sale-total` has no discount; the key must be absent, not null.
    const plain = items.find((item) => item.id === "greek-yogurt-natural");
    expect(plain).toBeDefined();
    expect(plain).not.toHaveProperty("oldPrice");
    expect(plain).not.toHaveProperty("discount");
  });

  it("exposes price as both a display string and a number", async () => {
    const body = await json(products(request("/api/products?brand=Meat%20Brand&sort=price_asc")));
    const item = (body.items as Record<string, unknown>[])[0];

    expect(item.price).toBe("$4.75");
    expect(item.priceValue).toBe(4.75);
    expect(item.oldPrice).toBe("$5.90");
    expect(item.originalPrice).toBe(5.9);
    expect(item.discountRate).toBe(20);
    expect(item.inStock).toBe(true);
  });
});

describe("GET /api/products/{id}", () => {
  it("returns the detail copy and gallery", async () => {
    const response = product(request("/api/products/beef-mince"), {
      params: Promise.resolve({ id: "beef-mince" }),
    });
    const body = await json(response);

    expect(await status(response)).toBe(200);
    expect(body.id).toBe("beef-mince");
    expect(body.sku).toBe("FM-BM-20-500");
    expect(body.highlights).toContain("20% fat ratio, coarse ground");
    expect(body.specs).toEqual(
      expect.arrayContaining([{ label: "Fat Ratio", value: "20%" }]),
    );
    expect((body.gallery as { src: string }[]).length).toBeGreaterThan(1);
  });

  it("404s an unknown id with the error envelope", async () => {
    const response = product(request("/api/products/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(await status(response)).toBe(404);
    expect(await json(response)).toEqual({
      error: { code: "not_found", message: 'Product "nope" was not found.' },
    });
  });
});

describe("GET /api/products/{id}/related", () => {
  it("puts same-brand products first and excludes the product itself", async () => {
    const response = related(request("/api/products/beef-mince/related"), {
      params: Promise.resolve({ id: "beef-mince" }),
    });
    const body = await json(response);
    const items = body.items as { id: string; brand: string }[];

    expect(body.id).toBe("beef-mince");
    expect(items.some((item) => item.id === "beef-mince")).toBe(false);
    // "Meat Brand" is the brand of beef-mince, so those rows come first.
    expect(items[0].brand).toBe("Meat Brand");
  });

  it("honours limit and clamps it to 24", async () => {
    const body = await json(
      related(request("/api/products/beef-mince/related?limit=2"), {
        params: Promise.resolve({ id: "beef-mince" }),
      }),
    );

    expect((body.items as unknown[]).length).toBe(2);
  });

  it("404s an unknown id rather than returning related items", async () => {
    expect(
      await status(
        related(request("/api/products/nope/related"), {
          params: Promise.resolve({ id: "nope" }),
        }),
      ),
    ).toBe(404);
  });
});

describe("GET /api/categories", () => {
  it("lists categories with their product counts", async () => {
    const body = await json(categories());
    const items = body.items as { name: string; label: string; productCount: number }[];

    expect(items).toHaveLength(8);
    expect(items.find((item) => item.name === "raw-meats")).toMatchObject({
      label: "Raw Meats",
      productCount: 4,
    });
  });
});

describe("GET /api/categories/{name}/products", () => {
  it("echoes the category alongside its products", async () => {
    const response = categoryProducts(request("/api/categories/raw-meats/products"), {
      params: Promise.resolve({ name: "raw-meats" }),
    });
    const body = await json(response);

    expect(await status(response)).toBe(200);
    expect(body.category).toMatchObject({ name: "raw-meats", label: "Raw Meats" });
    expect(body.meta).toMatchObject({ total: 4 });
    expect(
      (body.items as { category: string }[]).every((item) => item.category === "Raw Meats"),
    ).toBe(true);
  });

  it("is case-insensitive on the slug", async () => {
    expect(
      await status(
        categoryProducts(request("/api/categories/RAW-MEATS/products"), {
          params: Promise.resolve({ name: "RAW-MEATS" }),
        }),
      ),
    ).toBe(200);
  });

  it("ignores a sort value it has no ORDER BY clause for", async () => {
    // An unvalidated `sort` used to reach ORDER BY verbatim and 500.
    const response = categoryProducts(
      request("/api/categories/raw-meats/products?sort=constructor"),
      { params: Promise.resolve({ name: "raw-meats" }) },
    );

    expect(await status(response)).toBe(200);
    expect((await json(response)).meta).toMatchObject({ total: 4 });
  });

  it("404s an unknown slug", async () => {
    const response = categoryProducts(request("/api/categories/nope/products"), {
      params: Promise.resolve({ name: "nope" }),
    });

    expect(await status(response)).toBe(404);
    expect(await json(response)).toEqual({
      error: { code: "not_found", message: 'Category "nope" was not found.' },
    });
  });
});

describe("GET /api/brands", () => {
  it("returns only the four promo tiles", async () => {
    const body = await json(brands());
    const items = body.items as { id: string; tag: string }[];

    expect(items).toHaveLength(4);
    expect(items.map((item) => item.id)).toEqual(["foodpouch", "itek", "soda", "farmart"]);
  });
});

describe("GET /api/shelves", () => {
  it("returns the top savers", async () => {
    const body = await json(topSavers());
    expect(body.shelf).toBe("top-savers");
    expect((body.items as unknown[]).length).toBe(5);
  });

  it("honours the All tab the endpoint itself publishes", async () => {
    const all = await json(bestSellers(request("/api/shelves/best-sellers")));
    const filters = all.filters as string[];
    const filtered = await json(
      bestSellers(request(`/api/shelves/best-sellers?category=${filters[0]}`)),
    );

    expect(filters[0]).toBe("All");
    expect(filtered.items).toEqual(all.items);
  });

  it("returns best sellers with their filter tabs", async () => {
    const body = await json(bestSellers(request("/api/shelves/best-sellers")));

    expect(body.shelf).toBe("best-sellers");
    expect((body.filters as string[])[0]).toBe("All");
    expect((body.items as unknown[]).length).toBe(13);
  });

  it("narrows best sellers by category label", async () => {
    const body = await json(
      bestSellers(request("/api/shelves/best-sellers?category=Pet%20Foods")),
    );
    const items = body.items as { category: string }[];

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === "Pet Foods")).toBe(true);
  });
});

describe("GET /api/openapi", () => {
  it("serves the spec the route and /docs both read", async () => {
    const response = openapi();
    const body = (await (await response).json()) as typeof openApiSpec;

    expect(await status(response)).toBe(200);
    expect(Object.keys(body.paths)).toEqual(Object.keys(openApiSpec.paths));
    expect(body.info.title).toBe(openApiSpec.info.title);
  });
});

describe("the OpenAPI document", () => {
  it("documents every path the app serves", () => {
    const documented = Object.keys(openApiSpec.paths);
    expect(documented.sort()).toEqual([
      "/api/brands",
      "/api/categories",
      "/api/categories/{name}/products",
      "/api/hello",
      "/api/openapi",
      "/api/products",
      "/api/products/{id}",
      "/api/products/{id}/related",
      "/api/shelves/best-sellers",
      "/api/shelves/top-savers",
    ]);
  });

  it("references only schemas it defines", () => {
    // A typo in a $ref would render as a broken section in Swagger UI.
    const refs = JSON.stringify(openApiSpec).match(/#\/components\/schemas\/[A-Za-z]+/g) ?? [];
    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "");
      expect(openApiSpec.components.schemas).toHaveProperty(name);
    }
  });

  it("matches the shape the products endpoint actually returns", async () => {
    const body = await json(products(request("/api/products?limit=1")));
    const { required } = openApiSpec.components.schemas.ProductSummary;
    const [first] = body.items as Record<string, unknown>[];

    for (const field of required) {
      expect(first).toHaveProperty(field);
    }
  });
});
