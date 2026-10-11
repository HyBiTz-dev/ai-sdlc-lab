/**
 * OpenAPI 3.0 description of the Farmart API. Served as JSON from
 * `/api/openapi` and rendered by Swagger UI at `/docs`.
 */

const priceFields = {
  price: {
    type: "string",
    description: "Display price including the currency symbol.",
    example: "$38.00",
  },
  priceValue: {
    type: "number",
    format: "float",
    description: "Numeric price for calculations.",
    example: 38,
  },
  oldPrice: {
    type: "string",
    description: "Original price, only present while a discount is running.",
    example: "$5.90",
  },
  originalPrice: {
    type: "number",
    format: "float",
    description: "Numeric original price.",
    example: 5.9,
  },
  discount: {
    type: "string",
    description: "Discount badge as shown on the card.",
    example: "-20%",
  },
  discountRate: {
    type: "integer",
    description:
      "Discount as a positive percentage. Taken from the badge when present, otherwise derived from the two prices.",
    example: 20,
  },
};

const listingProperties = {
  id: { type: "string", example: "beef-mince" },
  brand: { type: "string", example: "Meat Brand" },
  name: { type: "string", example: "British Beef Mince (20% Fat)" },
  image: { type: "string", format: "uri", example: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f" },
  alt: { type: "string", example: "Beef mince" },
  rating: { type: "integer", minimum: 0, maximum: 5, nullable: true, example: 4 },
  reviewCount: { type: "integer", nullable: true, example: 8 },
  sold: { type: "integer", nullable: true, description: "Units sold so far.", example: 16 },
  total: { type: "integer", nullable: true, description: "Units in stock.", example: 40 },
  inStock: { type: "boolean", nullable: true, example: true },
  category: { type: "string", nullable: true, example: "Raw Meats" },
  sku: { type: "string", nullable: true, example: "FM-BM-20-500" },
  unit: { type: "string", nullable: true, example: "500g pack" },
  ...priceFields,
};

const paginationParams = [
  {
    name: "page",
    in: "query",
    description: "1-based page number.",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "limit",
    in: "query",
    description: "Items per page.",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 12 },
  },
];

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Farmart API",
    version: "1.0.0",
    description:
      "Read API behind the Farmart storefront. The catalogue lives in a local SQLite database (seeded from `src/db/seed-data.ts`); prices are USD and returned both as a display string and as numeric cents.",
    contact: { name: "Farmart Support", url: "https://farmart.example.com" },
    license: { name: "MIT" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local dev" },
    { url: "https://api.farmart.example.com", description: "Production" },
  ],
  tags: [
    { name: "Health", description: "Service availability" },
    { name: "Products", description: "Catalogue products and product detail" },
    { name: "Categories", description: "Shop-by-category navigation" },
    { name: "Brands", description: "Promotional brand tiles" },
    { name: "Shelves", description: "Homepage shelves (top savers, best sellers)" },
  ],
  paths: {
    "/api/openapi": {
      get: {
        tags: ["Health"],
        summary: "This document",
        description:
          "The OpenAPI description rendered at `/docs`. Useful for generating a client or checking the contract from the command line.",
        responses: {
          200: {
            description: "The OpenAPI 3.0 document.",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/hello": {
      get: {
        tags: ["Health"],
        summary: "Smoke test",
        description: "Returns a fixed greeting so the service can be pinged.",
        responses: {
          200: {
            description: "Service is reachable.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "Hello World!" } },
                },
                example: { message: "Hello World!" },
              },
            },
          },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Search and list products",
        description:
          "Paginated catalogue with full-text search, category, brand and sorting. This is what `/search` renders, and the response carries facet counts for the filter sidebar. When `q` is present the results are ranked by FTS5 relevance instead of `sort`.",
        parameters: [
          {
            name: "q",
            in: "query",
            description:
              "Full-text match on product name, brand, SKU and description. Every word is matched as a prefix, so `beef min` finds `British Beef Mince`.",
            schema: { type: "string" },
            example: "beef",
          },
          {
            name: "category",
            in: "query",
            description: "Category display name, e.g. `Raw Meats`.",
            schema: { type: "string" },
            example: "Raw Meats",
          },
          { name: "brand", in: "query", schema: { type: "string" }, example: "Farmart" },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["price_asc", "price_desc", "rating", "best_selling"],
              default: "best_selling",
            },
          },
          {
            name: "onSale",
            in: "query",
            description: "Only products carrying a discount.",
            schema: { type: "boolean" },
          },
          ...paginationParams,
        ],
        responses: {
          200: {
            description: "A page of products with facet counts. An empty `items` array is still a 200.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductPage" },
              },
            },
          },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get one product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "beef-mince",
          },
        ],
        responses: {
          200: {
            description: "The product with detail copy and gallery.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          404: {
            description: "No product with that id.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/products/{id}/related": {
      get: {
        tags: ["Products"],
        summary: "Related products",
        description: "Same-brand products first, then everything else. Never includes the product itself.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "beef-mince",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 24, default: 6 },
          },
        ],
        responses: {
          200: {
            description: "Up to `limit` suggested products.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "beef-mince" },
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductSummary" },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "No product with that id.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        responses: {
          200: {
            description: "All shop-by-category tiles.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/categories/{name}/products": {
      get: {
        tags: ["Categories", "Products"],
        summary: "Products in a category",
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            description: "Category slug from `/api/categories`, e.g. `raw-meats`.",
            schema: { type: "string" },
            example: "raw-meats",
          },
          ...paginationParams,
        ],
        responses: {
          200: {
            description: "The category plus a page of its products.",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ProductPage" },
                    {
                      type: "object",
                      properties: {
                        category: { $ref: "#/components/schemas/Category" },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: {
            description: "Unknown category.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/brands": {
      get: {
        tags: ["Brands"],
        summary: "List brand promos",
        responses: {
          200: {
            description: "The four promotional brand tiles on the homepage.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Brand" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/shelves/top-savers": {
      get: {
        tags: ["Shelves"],
        summary: "Top savers shelf",
        responses: {
          200: {
            description: "Discounted products, most saved first.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    shelf: { type: "string", example: "top-savers" },
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductSummary" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/shelves/best-sellers": {
      get: {
        tags: ["Shelves"],
        summary: "Best sellers shelf",
        parameters: [
          {
            name: "category",
            in: "query",
            description:
              "Restrict to one of the homepage filter tabs. `All` (or omitting the param) returns the whole shelf.",
            schema: {
              type: "string",
              enum: [
                "All",
                "Fruits & Vegetables",
                "Frozen Seafoods",
                "Raw Meats",
                "Coffee & Teas",
                "Pet Foods",
                "Milks & Dairies",
              ],
            },
          },
        ],
        responses: {
          200: {
            description: "Best selling products.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    shelf: { type: "string", example: "best-sellers" },
                    filters: {
                      type: "array",
                      items: { type: "string" },
                      description: "The filter tabs rendered above the shelf.",
                    },
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductSummary" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Spec: {
        type: "object",
        required: ["label", "value"],
        properties: {
          label: { type: "string", example: "Storage" },
          value: { type: "string", example: "Keep refrigerated 0-4°C" },
        },
      },
      GalleryImage: {
        type: "object",
        required: ["src", "alt"],
        properties: {
          src: { type: "string", format: "uri" },
          alt: { type: "string" },
        },
      },
      ProductSummary: {
        type: "object",
        required: ["id", "brand", "name", "image", "alt", "price", "priceValue"],
        properties: listingProperties,
      },
      Product: {
        allOf: [
          { $ref: "#/components/schemas/ProductSummary" },
          {
            type: "object",
            properties: {
              description: {
                type: "string",
                example:
                  "British beef minced to a 20% fat ratio — enough for a rich burger, lean enough for a weeknight bolognese.",
              },
              highlights: {
                type: "array",
                items: { type: "string" },
                example: ["20% fat ratio, coarse ground", "Chilled and vacuum sealed"],
              },
              specs: {
                type: "array",
                items: { $ref: "#/components/schemas/Spec" },
              },
              gallery: {
                type: "array",
                items: { $ref: "#/components/schemas/GalleryImage" },
                description: "Extra angles; the main `image` is always first.",
              },
            },
          },
        ],
      },
      ProductPage: {
        type: "object",
        required: ["items", "meta"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductSummary" },
          },
          meta: {
            type: "object",
            required: ["page", "limit", "total", "totalPages"],
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 12 },
              total: { type: "integer", example: 29 },
              totalPages: { type: "integer", example: 3 },
            },
          },
          facets: {
            type: "object",
            description:
              "Result counts per category and brand, for the search sidebar. Each group ignores its own filter, so it shows what switching to another value would return.",
            properties: {
              categories: {
                type: "array",
                items: { $ref: "#/components/schemas/FacetCount" },
              },
              brands: {
                type: "array",
                items: { $ref: "#/components/schemas/FacetCount" },
              },
            },
          },
        },
      },
      FacetCount: {
        type: "object",
        required: ["value", "label", "count"],
        properties: {
          // `value` is the value sent back as ?category=, which the query
          // matches against `categories.label` — so it is the label, not the slug.
          value: { type: "string", example: "Raw Meats" },
          label: { type: "string", example: "Raw Meats" },
          count: { type: "integer", example: 4 },
        },
      },
      Category: {
        type: "object",
        required: ["name", "label", "lines", "icon", "productCount"],
        properties: {
          name: { type: "string", description: "URL slug.", example: "raw-meats" },
          label: { type: "string", description: "Full display label, used as the `category` filter value.", example: "Raw Meats" },
          lines: {
            type: "array",
            description: "Authored line break for the category tile.",
            items: { type: "string" },
            example: ["Raw", "Meats"],
          },
          icon: { type: "string", example: "fa-solid fa-drumstick-bite" },
          productCount: { type: "integer", example: 4 },
        },
      },
      Brand: {
        type: "object",
        required: ["id", "tag", "title", "image", "alt"],
        properties: {
          id: { type: "string", example: "farmart" },
          tag: { type: "string", example: "Farmart" },
          title: { type: "string", example: "Fresh Meat Sausage, BUY 2 GET 1" },
          image: { type: "string", format: "uri" },
          alt: { type: "string", example: "Meat Sausage" },
          background: { type: "string", example: "#eef7ee" },
        },
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "not_found" },
              message: { type: "string", example: "Product \"nope\" was not found." },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
