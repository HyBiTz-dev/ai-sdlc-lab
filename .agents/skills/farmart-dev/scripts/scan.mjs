/**
 * Static scan of the Farmart source tree.
 *
 * Everything here is read from files — no imports, no build, no server. The
 * output is the auto-generated half of `.agents/skills/farmart-dev/SKILL.md`,
 * so it has to be cheap and safe to run on a timer: it must not execute app
 * code, must not touch the database, and must not fail loudly when a file it
 * expected has moved.
 *
 * Facts that cannot be read statically (row counts) come from `db-counts.mjs`,
 * which boots an in-memory copy of the real client.
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const CODE_EXT = /\.(ts|tsx|mjs|js)$/

/** Directories that hold no project knowledge. */
const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "data", "graphify-out"])

/** Recursively lists files under `dir`, repo-relative, skipping IGNORED_DIRS. */
export function walk(dir, root = process.cwd()) {
  const out = []
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".agents") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      out.push(...walk(full, root))
    } else if (entry.isFile()) {
      out.push(path.relative(root, full))
    }
  }

  return out.sort()
}

function read(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), "utf8")
  } catch {
    return ""
  }
}

// --------------------------------------------------------------------- routes

/**
 * Maps the App Router tree to URL routes.
 *
 * `src/app/search/page.tsx` is `/search`; a `[slug]` segment is a dynamic
 * segment; a route group `(marketing)` is not part of the URL. The returned
 * path is the *pattern*, and is what a test or a caller must interpolate.
 */
export function collectRoutes(root) {
  const routes = []

  for (const file of walk(path.join(root, "src", "app"), root)) {
    const base = file.slice("src/app/".length)
    const isPage = base === "page.tsx" || base.endsWith("/page.tsx")
    const isRoute = base === "route.ts" || base.endsWith("/route.ts")
    if (!isPage && !isRoute) continue

    const segments = base
      .split("/")
      .slice(0, -1)
      .filter((segment) => segment && !(segment.startsWith("(") && segment.endsWith(")")))

    const url = `/${segments.join("/")}` || "/"
    // A page can opt out of streaming with `instant = false`, so the flag is
    // read for pages too — `/product/[id]` is the one that currently does.
    const blocking = /export const instant = false/.test(read(root, file))

    if (isPage) {
      routes.push({ kind: "page", url, file, methods: [], blocking })
    } else {
      routes.push({ kind: "api", url, file, methods: httpMethods(read(root, file)), blocking })
    }
  }

  return routes.sort((a, b) => a.url.localeCompare(b.url))
}

function httpMethods(source) {
  const found = new Set()
  // `export const GET = ...` and `export async function POST()` both count.
  for (const match of source.matchAll(/export\s+(?:async\s+)?(?:const|function)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) {
    found.add(match[1])
  }
  return [...found].sort()
}

// ----------------------------------------------------------------- components

/** Every component under `src/components`, flagged with how it renders. */
export function collectComponents(root) {
  const out = []

  for (const file of walk(path.join(root, "src", "components"), root)) {
    if (!/\.tsx$/.test(file)) continue
    const source = read(root, file)
    const exported = [...source.matchAll(/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w*)/g)]
      .map((match) => match[1])
    out.push({
      file,
      client: /^\s*["']use client["']/.test(source),
      names: exported.length ? exported : ["(no named export)"],
    })
  }

  return out
}

// ------------------------------------------------------------------ db & lib

/** Exported function and const names from a module, ignoring type-only exports. */
export function collectExports(root, files) {
  return files.map((file) => {
    const source = read(root, file)
    const names = new Set()
    for (const match of source.matchAll(
      /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)|export\s+class\s+(\w+)/g,
    )) {
      names.add(match[1] ?? match[2] ?? match[3])
    }
    // `export type` / `export interface` are erased at runtime and carry no
    // behavioural information worth listing here.
    return { file, exports: [...names].sort() }
  })
}

/** Table names declared in `src/db/schema.ts`, including the FTS virtual table. */
export function collectTables(root) {
  const source = read(root, "src/db/schema.ts")
  const tables = []
  for (const match of source.matchAll(
    /CREATE\s+(?:VIRTUAL\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi,
  )) {
    tables.push(match[1])
  }
  return [...new Set(tables)].sort()
}

// --------------------------------------------------------------------- tests

/** `describe`/`it`/`test` occurrences per test file. */
export function collectTests(root) {
  return walk(root)
    .filter((file) => /\.test\.tsx?$/.test(file))
    .map((file) => {
      const source = read(root, file)
      return {
        file,
        suites: (source.match(/\b(?:describe|test\.describe)\s*\(/g) ?? []).length,
        cases: (source.match(/\b(?:it|test)\s*\(/g) ?? []).length,
      }
    })
}

/** Playwright `test(` occurrences per spec, excluding the shared helpers. */
export function collectE2E(root) {
  const dir = path.join(root, "e2e")
  return walk(dir, root)
    .filter((file) => file.endsWith(".spec.ts"))
    .map((file) => ({ file, cases: (read(root, file).match(/\btest\s*\(/g) ?? []).length }))
}

// ------------------------------------------------------------- project config

export function readPackage(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
  } catch {
    return { scripts: {}, dependencies: {}, devDependencies: {} }
  }
}

/** Counts of code files and lines per top-level source area. */
export function collectSize(root) {
  const areas = {}
  for (const file of walk(path.join(root, "src"), root)) {
    if (!CODE_EXT.test(file)) continue
    // Group at `src/<area>` rather than per file. A per-file table in this repo
    // is 40+ rows of mostly-1, which buries the two modules that are actually
    // large; two levels of directory would not help either.
    const area = file.split("/").slice(0, 2).join("/")
    const lines = read(root, file).split("\n").length
    areas[area] ??= { files: 0, lines: 0 }
    areas[area].files += 1
    areas[area].lines += lines
  }
  return areas
}

// ------------------------------------------------------------------ rendering

const table = (headers, rows) =>
  rows.length
    ? [
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(() => "---").join(" | ")} |`,
        ...rows.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n")
    : "_none_"

/** Renders the auto-generated section. Pure function of the scan result. */
export function renderSection(scan) {
  const pkg = scan.package
  const parts = []

  parts.push("## Project snapshot (auto-generated)")
  parts.push("")
  parts.push(
    `_Generated by \`farmart-dev/scripts/sync.mjs\`. Do not hand-edit below this line; ` +
      `edit the script instead. Last run ${scan.generatedAt}._`,
  )
  parts.push("")

  parts.push("### Versions")
  parts.push("")
  parts.push(
    table(
      ["Thing", "Value"],
      [
        ["Branch / HEAD", scan.gitHead],
        ["Next.js", pkg.dependencies?.next ?? "—"],
        ["React", pkg.dependencies?.react ?? "—"],
        ["Database", pkg.dependencies?.["better-sqlite3"] ?? "—"],
        ["Node on this machine", scan.nodeVersion],
        ["Tailwind", pkg.devDependencies?.tailwindcss ?? "—"],
        ["TypeScript", pkg.devDependencies?.typescript ?? "—"],
      ],
    ),
  )
  parts.push("")

  parts.push("### Routes")
  parts.push("")
  parts.push(
    table(
      ["URL pattern", "Kind", "Handler", "Notes"],
      scan.routes.map((route) => [
        `\`${route.url}\``,
        route.kind,
        // Pages have no HTTP methods; show the file's route segment instead.
        route.kind === "api" ? route.methods.join(", ") || "—" : "—",
        route.blocking ? "`instant = false` (blocks the shell)" : "",
      ]),
    ),
  )
  parts.push("")

  parts.push("### Components")
  parts.push("")
  parts.push(
    table(
      ["File", "Rendering", "Exports"],
      scan.components.map((component) => [
        `\`${component.file}\``,
        component.client ? "client" : "server",
        component.names.join(", "),
      ]),
    ),
  )
  parts.push("")

  parts.push("### Data layer")
  parts.push("")
  parts.push(
    table(
      ["Table", "Rows"],
      scan.tables.map((name) => [
        `\`${name}\``,
        scan.rowCounts?.counts?.[name] ?? "—",
      ]),
    ),
  )
  parts.push("")
  if (scan.rowCounts?.counts?.byShelf) {
    const shelves = Object.entries(scan.rowCounts.counts.byShelf)
    parts.push(
      `Shelf membership: ${shelves.map(([shelf, count]) => `\`${shelf}\` ${count}`).join(", ")}. ` +
        `A product on no shelf is invisible on the homepage and raises no error.`,
    )
    parts.push("")
  }
  if (scan.rowCounts?.source === "unavailable") {
    parts.push(`> Row counts unavailable: ${scan.rowCounts.reason}`)
    parts.push("")
  }

  parts.push("### Query and lib exports")
  parts.push("")
  parts.push(
    table(
      ["Module", "Exports"],
      scan.exports.map((entry) => [`\`${entry.file}\``, entry.exports.join(", ") || "—"]),
    ),
  )
  parts.push("")

  parts.push("### Tests")
  parts.push("")
  parts.push(
    table(
      ["Test file", "Suites", "Cases"],
      scan.tests.map((test) => [`\`${test.file}\``, String(test.suites), String(test.cases)]),
    ),
  )
  parts.push("")
  parts.push(
    table(
      ["E2E spec", "Cases"],
      scan.e2e.map((spec) => [`\`${spec.file}\``, String(spec.cases)]),
    ),
  )
  parts.push("")

  parts.push("### Source size")
  parts.push("")
  parts.push(
    table(
      ["Area", "Files", "Lines"],
      Object.entries(scan.size)
        .sort((a, b) => b[1].lines - a[1].lines)
        .map(([area, stat]) => [`\`${area}\``, String(stat.files), String(stat.lines)]),
    ),
  )
  parts.push("")

  parts.push("### npm scripts")
  parts.push("")
  parts.push(
    table(
      ["Script", "Command"],
      Object.entries(pkg.scripts ?? {}).map(([name, command]) => [`\`${name}\``, `\`${command}\``]),
    ),
  )
  parts.push("")

  return parts.join("\n")
}