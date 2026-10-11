import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";

/**
 * Single better-sqlite3 handle per process. Next reloads modules in dev, so the
 * handle is parked on `globalThis` to avoid opening the file repeatedly.
 */

const DB_PATH =
  process.env.FARMART_DB_PATH ?? path.join(process.cwd(), "data", "farmart.db");

type FarmartGlobal = typeof globalThis & { __farmartDb?: Database.Database };

export function getDb(): Database.Database {
  const globals = globalThis as FarmartGlobal;
  if (globals.__farmartDb) return globals.__farmartDb;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  // WAL keeps reads non-blocking while a seed or write is in flight.
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);
  seedIfEmpty(db);

  globals.__farmartDb = db;
  return db;
}

