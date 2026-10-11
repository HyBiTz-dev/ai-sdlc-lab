import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Route handlers must speak `next/server`: NextResponse for replies,
// NextRequest for the incoming request. Raw Web `Response` / `Request`
// bypass Next's cookie/header rewriting, so we ban them inside API routes.
const NEXT_RESPONSE_MSG =
  "Use NextResponse from \"next/server\" instead of the Web Response API in API route handlers (e.g. NextResponse.json(...)).";
const NEXT_REQUEST_MSG =
  "Use NextRequest from \"next/server\" as the request parameter type in API route handlers.";
const NEXT_SERVER_DEFAULT_MSG =
  "Import NextResponse/NextRequest as a named import from \"next/server\" (no default import).";

const apiRouteFiles = ["src/app/api/**/route.{ts,tsx,js,jsx,mts,mjs}"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "farmart/next-response-default",
    files: apiRouteFiles,
    rules: {
      // Bans every reference to the Web globals, in value and type position:
      // `new Response()`, `Response.json()`, `req: Request`, `Promise<Response>`.
      "no-restricted-globals": [
        "error",
        { name: "Response", message: NEXT_RESPONSE_MSG },
        { name: "Request", message: NEXT_REQUEST_MSG },
      ],
      // Type positions, which `no-restricted-globals` doesn't cover:
      // `req: Request`, `Promise<Response>`, `: NextResponse | null`.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSTypeReference[typeName.name='Response']",
          message: NEXT_RESPONSE_MSG,
        },
        {
          selector: "TSTypeReference[typeName.name='Request']",
          message: NEXT_REQUEST_MSG,
        },
        {
          // `globalThis.Response` dodges `no-restricted-globals`.
          selector: "MemberExpression[object.object.name='globalThis'][object.property.name=/^(Response|Request)$/]",
          message:
            "Use NextResponse/NextRequest from \"next/server\" instead of the Web Response/Request API in API route handlers.",
        },
      ],
      // No default import of "next/server", no deep imports of Next's internals.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/server",
              importNames: ["default"],
              message: NEXT_SERVER_DEFAULT_MSG,
            },
          ],
          patterns: [
            {
              group: ["**/dist/server/web/spec-extension/*"],
              message: NEXT_SERVER_DEFAULT_MSG,
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build artefacts.
    "coverage/**",
    "data/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
