#!/usr/bin/env node
/**
 * Deletes the E2E database so every run starts from a freshly seeded catalogue.
 *
 * Why this is a separate script instead of a Playwright `globalSetup`: the
 * database is created lazily, on the first request that reads it — and
 * Playwright's own readiness probe against `webServer.url` is such a request.
 * A globalSetup would therefore delete the file *after* `next start` had already
 * opened it, leaving the server serving from an unlinked inode and writing a
 * brand new file nobody reads. Deleting before the server boots is the only
 * ordering that is actually safe.
 *
 * The script refuses to touch anything outside `data/e2e/`. It never runs while
 * the dev server is up, because `webServer.command` only executes when Playwright
 * had to start the server itself (`reuseExistingServer` short-circuits it).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Must stay in sync with `E2E_DB_PATH` in `playwright.config.ts`. */
const dbPath = path.join(root, "data", "e2e", "farmart-e2e.db");

const guard = path.join(root, "data", "e2e") + path.sep;
if (!dbPath.startsWith(guard)) {
  console.error(`[e2e] refusing to delete ${dbPath} — outside ${guard}`);
  process.exit(1);
}

let removed = 0;
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${dbPath}${suffix}`;
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    removed += 1;
  }
}

if (removed === 0) {
  console.log("[e2e] database already clean");
} else {
  console.log(`[e2e] removed ${removed} file(s) for ${path.relative(root, dbPath)}`);
}