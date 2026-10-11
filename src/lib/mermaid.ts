import { getDb } from "@/db/client";

/**
 * Reads the live SQLite schema and renders it as a Mermaid `erDiagram`.
 *
 * Generating from `PRAGMA` rather than hardcoding means the diagram cannot
 * drift from the database: add a column to a migration and the page follows.
 */

type Column = {
  name: string;
  type: string;
  notnull: number;
  /** 1 when the column takes part in the primary key. */
  pk: number;
};

type ForeignKey = {
  table: string;
  from: string;
  to: string;
  on_update: string | null;
  on_delete: string | null;
};

/** `PRAGMA index_list` output, before its columns are read. */
type IndexRef = { name: string; unique: number };
type Index = IndexRef & { columns: string[] };

export type Table = {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
  /** FTS5 and other virtual tables are derived, not owned data. */
  virtual: boolean;
};

const VIRTUAL_PREFIX = /^CREATE VIRTUAL TABLE/;

/**
 * FTS5 keeps its index in shadow tables named `<fts_table>_<suffix>`. They are
 * an implementation detail of `sqlite_master`, not part of the model, so they
 * are hidden — otherwise the diagram grows a box per index page.
 */
const FTS_SHADOW_SUFFIX = /_(data|idx|content|docsize|config)$/;

export function readSchema(): { tables: Table[] } {
  const db = getDb();

  const all = db
    .prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'table' ORDER BY name`)
    .all() as { name: string; sql: string }[];

  const master = all.filter(({ name }) => !FTS_SHADOW_SUFFIX.test(name));

  const tables = master.map(({ name, sql }): Table => {
    const indexes = db.prepare(`PRAGMA index_list(${quote(name)})`).all() as IndexRef[];

    return {
      name,
      columns: db.prepare(`PRAGMA table_info(${quote(name)})`).all() as Column[],
      foreignKeys: db.prepare(`PRAGMA foreign_key_list(${quote(name)})`).all() as ForeignKey[],
      // Each index needs its own PRAGMA to read the columns it covers.
      indexes: indexes.map((index) => ({
        ...index,
        columns: (
          db.prepare(`PRAGMA index_info(${quote(index.name)})`).all() as {
            name: string;
          }[]
        ).map((column) => column.name),
      })),
      virtual: VIRTUAL_PREFIX.test(sql ?? ""),
    };
  });

  return { tables };
}

function quote(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Primary key columns, in declaration order. */
function primaryKey(table: Table): string[] {
  return table.columns
    .filter((column) => column.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((column) => column.name);
}

function isForeignKey(table: Table, column: string): boolean {
  return table.foreignKeys.some((key) => key.from === column);
}

/**
 * Whether the column alone identifies a row. A composite primary key does not
 * count: in `PRIMARY KEY (shelf, product_id)` the product id repeats per shelf,
 * so a product still has many shelf rows.
 */
function isUnique(table: Table, column: string): boolean {
  const pk = primaryKey(table);
  if (pk.includes(column)) return pk.length === 1;

  return table.indexes.some(
    (index) =>
      index.unique === 1 &&
      index.columns.length === 1 &&
      index.columns[0] === column &&
      // SQLite allows many NULLs in a UNIQUE index, so a nullable column is not enforced.
      !table.columns.find((entry) => entry.name === column)?.notnull,
  );
}

/**
 * Mermaid cardinality for a foreign key, from the child's point of view:
 * `"0 or 1"` when the column is nullable, `"exactly 1"` otherwise. The child
 * side is `0 or more`, except when the FK column is itself unique.
 */
function cardinality(table: Table, key: ForeignKey): { parent: string; child: string } {
  const column = table.columns.find((entry) => entry.name === key.from);
  const parent = column?.notnull ? "||" : "o|";

  // A unique FK gives at most one child row per parent, and `ON DELETE CASCADE`
  // guarantees at least one exists.
  const cascading = key.on_delete?.toUpperCase() === "CASCADE";
  if (isUnique(table, key.from)) {
    return { parent, child: cascading ? "||" : "|{" };
  }
  return { parent, child: cascading ? "|{" : "o{" };
}

/** Mermaid attribute lines: `type name` plus PK/FK/UK keys. */
function attributes(table: Table): string[] {
  const pk = new Set(primaryKey(table));

  return table.columns.map((column) => {
    // A key is meaningful in every row, so it never carries the nullable
    // marker even where SQLite technically permits a NULL primary key.
    const nullable = column.notnull === 0 && !pk.has(column.name);
    // FTS5 columns report an empty type; name them so the line stays valid.
    const type = (column.type || "text").toLowerCase();
    const label = nullable ? `${type}?` : type;

    const keys: string[] = [];
    if (pk.has(column.name)) keys.push("PK");
    if (isForeignKey(table, column.name)) keys.push("FK");
    if (!pk.has(column.name) && isUnique(table, column.name)) keys.push("UK");

    return keys.length
      ? `        ${label} ${column.name} ${keys.join(", ")}`
      : `        ${label} ${column.name}`;
  });
}

/** A one-line summary rendered as the Mermaid entity alias. */
function alias(table: Table): string | undefined {
  if (table.virtual) return "derived search index";
  if (table.name === "products") return "one row per product";
  if (table.name === "product_shelves") return "product on a homepage shelf";
  if (table.name === "shelf_filters") return "filter tab of a shelf";
  return undefined;
}

export function buildErDiagram(tables: Table[]): string {
  const lines: string[] = [
    "erDiagram",
    "    %% Generated from the live SQLite schema by src/lib/mermaid.ts",
    "    %% ? suffix = nullable, PK/FK/UK = key",
    "",
  ];

  for (const table of tables) {
    const label = alias(table);
    lines.push(`    ${table.name}${label ? `["${table.name} — ${label}"]` : ""} {`);
    lines.push(...attributes(table));
    lines.push("    }");
    lines.push("");
  }

  for (const table of tables) {
    for (const key of table.foreignKeys) {
      const { parent, child } = cardinality(table, key);
      lines.push(`    ${key.table} ${parent}--${child} ${table.name} : "${key.from}"`);
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function mermaidErSource(): string {
  return buildErDiagram(readSchema().tables);
}
