import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

/**
 * `readCoverage` reads a gitignored build artefact written incrementally by
 * `npm run test:coverage`, so "absent", "truncated" and "no data" are all
 * reachable states. `/tests` is prerendered, so each of them must render an
 * empty state rather than throw during the build.
 *
 * `SUMMARY_PATH` is resolved from `process.cwd()` at module load, so the cwd is
 * swapped before the import and restored after.
 */

const EMPTY = { total: null, files: [], generatedAt: null };

const REAL_CWD = process.cwd();
let workdir: string;

async function loadCoverage() {
  return await import("@/lib/coverage");
}

// One workdir for the whole file, because `coverage.ts` resolves SUMMARY_PATH
// once at module load — a fresh temp dir per test would point it at a
// directory that no longer exists.
beforeAll(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "farmart-coverage-"));
  fs.mkdirSync(path.join(workdir, "coverage"));
  process.chdir(workdir);
});

afterEach(() => {
  fs.rmSync(path.join(workdir, "coverage", "coverage-summary.json"), { force: true });
});

afterAll(() => {
  process.chdir(REAL_CWD);
  fs.rmSync(workdir, { recursive: true, force: true });
});

const write = (contents: string) =>
  fs.writeFileSync(path.join(workdir, "coverage", "coverage-summary.json"), contents);

describe("readCoverage", () => {
  it("reports the empty state when the summary has not been generated", async () => {
    const { readCoverage } = await loadCoverage();
    expect(readCoverage()).toEqual(EMPTY);
  });

  it("does not throw on a truncated summary", async () => {
    // An interrupted `test:coverage` leaves a half-written file behind.
    write('{"total":{"statements":{"total":10,"covered":5,"skipped":0,"pct":50');
    const { readCoverage } = await loadCoverage();

    expect(readCoverage()).toEqual(EMPTY);
  });

  it("does not throw on a zero-byte summary", async () => {
    write("");
    const { readCoverage } = await loadCoverage();

    expect(readCoverage()).toEqual(EMPTY);
  });

  it("reads percentages and sorts files by path", async () => {
    // Keys are paths as istanbul writes them — relative to the repo root.
    write(
      JSON.stringify({
        total: { statements: { total: 10, covered: 5, skipped: 0, pct: 50 } },
        "src/b.ts": { lines: { total: 4, covered: 2, skipped: 0, pct: 25 } },
        "src/a.ts": { lines: { total: 4, covered: 4, skipped: 0, pct: 100 } },
      }),
    );
    const { readCoverage } = await loadCoverage();
    const report = readCoverage();

    expect(report.total?.statements).toBe(50);
    expect(report.files.map((file) => file.path)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(report.files.map((file) => file.metrics.lines)).toEqual([100, 25]);
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  it("treats Istanbul's Unknown percentage as zero", async () => {
    // `blankSummary()` in istanbul-lib-coverage writes pct: "Unknown".
    write(
      JSON.stringify({
        total: { statements: { total: 0, covered: 0, skipped: 0, pct: "Unknown" } },
        "src/a.ts": { lines: { total: 0, covered: 0, skipped: 0, pct: "Unknown" } },
      }),
    );
    const { readCoverage } = await loadCoverage();
    const report = readCoverage();

    expect(report.total?.statements).toBe(0);
    expect(report.files[0].metrics.lines).toBe(0);
    // The bug was a non-number reaching `.toFixed()` in the page.
    expect(typeof report.total?.statements).toBe("number");
  });
});