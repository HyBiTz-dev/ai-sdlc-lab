/**
 * Every test file gets its own in-memory database.
 *
 * `src/db/client.ts` reads `FARMART_DB_PATH` at module scope, and Vitest gives
 * each test file a fresh module registry, so this runs before any query module
 * is imported. `:memory:` keeps the real `data/farmart.db` untouched.
 */
process.env.FARMART_DB_PATH = ":memory:";
