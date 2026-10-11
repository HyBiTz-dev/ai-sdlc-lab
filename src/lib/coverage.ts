import fs from "node:fs";
import path from "node:path";

/**
 * Reads `coverage/coverage-summary.json`, which `npm run test:coverage`
 * produces. The file is a build artefact and gitignored, so the page has to
 * cope with it being absent — that is the state a fresh clone is in.
 */

export type CoverageMetrics = {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
};

export type FileCoverage = {
  file: string;
  /** Path relative to the repo root, for display. */
  path: string;
  metrics: CoverageMetrics;
};

export type CoverageReport = {
  /** null when `npm run test:coverage` has not been run yet. */
  total: CoverageMetrics | null;
  files: FileCoverage[];
  /** mtime of the summary, so the page can say how stale the numbers are. */
  generatedAt: Date | null;
};

/**
 * One entry as Istanbul writes it: a `total` count plus a `pct` percentage.
 * `pct` is typed `number | string` because Istanbul encodes "no data" as the
 * literal string `"Unknown"` — see `blankSummary()` in istanbul-lib-coverage.
 */
type Metric = { total: number; covered: number; skipped: number; pct: number | string };
type FileSummary = Record<string, Metric | undefined>;

type Summary = Record<string, FileSummary | undefined>;

const SUMMARY_PATH = path.join(process.cwd(), "coverage", "coverage-summary.json");

function metricsOf(entry: FileSummary | undefined): CoverageMetrics {
  const pct = (metric: Metric | undefined) =>
    typeof metric?.pct === "number" ? metric.pct : 0;

  return {
    statements: pct(entry?.statements),
    branches: pct(entry?.branches),
    functions: pct(entry?.functions),
    lines: pct(entry?.lines),
  };
}

export function readCoverage(): CoverageReport {
  if (!fs.existsSync(SUMMARY_PATH)) {
    return { total: null, files: [], generatedAt: null };
  }

  let summary: Summary;
  try {
    summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8")) as Summary;
  } catch {
    // The summary is written incrementally, so an interrupted `test:coverage`
    // leaves a truncated file. /tests is prerendered, so this must not throw.
    return { total: null, files: [], generatedAt: null };
  }

  const files = Object.entries(summary)
    // Istanbul adds a synthetic "total" entry keyed "total".
    .filter(([file]) => file !== "total")
    .map(([file, entry]) => ({
      file,
      path: path.relative(process.cwd(), file),
      metrics: metricsOf(entry),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    total: metricsOf(summary.total),
    files,
    generatedAt: fs.statSync(SUMMARY_PATH).mtime,
  };
}
