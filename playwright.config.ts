import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end regression suite.
 *
 * Three decisions worth knowing about:
 *
 * 1. **It runs against `next build` + `next start`, not `next dev`.** Most of
 *    this app's bug surface is prerendering: `cacheComponents` streams shells,
 *    `/mermaid` and `/tests` are baked at build time, and a dev server renders
 *    everything fresh on every request. Testing the build is the only way a
 *    regression suite catches those.
 * 2. **It uses its own database file.** `FARMART_DB_PATH` points at
 *    `data/e2e/farmart-e2e.db`, so a run never touches the `data/farmart.db`
 *    you develop against, and two checkouts can run side by side. The file is
 *    deleted by `npm run e2e:server` *before* the server boots — see the note
 *    there about why it cannot happen any later.
 * 3. **Port 3210, not 3000.** A dev server on 3000 must not be mistaken for the
 *    thing under test.
 */

const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/** Dedicated, disposable database. Must match `e2e/reset-db.mjs`. */
export const E2E_DB_PATH = path.resolve(__dirname, "data", "e2e", "farmart-e2e.db");

/**
 * A `@responsive` test asserts the phone layout, so it is meaningless at desktop
 * width — hence `grepInvert` below. Without it every responsive spec would run
 * twice and fail once.
 */
const RESPONSIVE = /@responsive/;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Remote imagery is served through `/_next/image` from Unsplash. A slow or
    // blocked CDN should fail a test about copy or layout, not about pictures,
    // so nothing here waits on an image to finish loading.
  },
  projects: [
    {
      name: "desktop",
      grepInvert: RESPONSIVE,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Only the responsive-tagged specs, so the mobile pass is a layout
      // regression check rather than a second run of the whole suite.
      name: "mobile",
      grep: RESPONSIVE,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run e2e:server",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: "pipe",
    // `next start` reads the port from this, so it has to match `baseURL`.
    env: { FARMART_DB_PATH: E2E_DB_PATH, E2E_PORT: String(PORT) },
  },
});