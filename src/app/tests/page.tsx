import type { Metadata } from "next";
import Link from "next/link";
import { readCoverage } from "@/lib/coverage";
import type { CoverageMetrics } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Test Report - Farmart",
  description: "Unit and integration test results with code coverage.",
};

/** 90% statements is the bar this project holds itself to. */
const TARGET = 90;

const METRICS: { key: keyof CoverageMetrics; label: string }[] = [
  { key: "statements", label: "Statements" },
  { key: "branches", label: "Branches" },
  { key: "functions", label: "Functions" },
  { key: "lines", label: "Lines" },
];

/** Tailwind token name per metric, so the bar colours match the design system. */
const BAR_CLASS = (value: number) =>
  value >= TARGET ? "bg-primary" : value >= 75 ? "bg-badge-red" : "bg-[#bbb]";

function CoverageBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-[5px] w-full max-w-[220px] overflow-hidden rounded-[10px] bg-[#eee]">
        <div
          className={`h-full ${BAR_CLASS(value)}`}
          style={{ width: `${Math.min(100, Math.max(value, value > 0 ? 2 : 0))}%` }}
        />
      </div>
      <span
        className={`w-11 text-right text-[11px] font-semibold ${
          value >= TARGET ? "text-primary" : "text-badge-red"
        }`}
      >
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function TestReportPage() {
  const { total, files, generatedAt } = readCoverage();

  return (
    <>
      <header className="bg-white">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 py-8 md:flex-row md:gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[#1a1a1a]">
              <i className="fa-solid fa-basket-shopping text-[22px] text-primary" />
              Farmart
            </Link>
            <div className="flex items-center gap-4 text-[13px] text-gray-text md:ml-auto">
              <Link href="/docs" className="hover:text-primary">
                API Docs
              </Link>
              <Link href="/mermaid" className="hover:text-primary">
                Schema
              </Link>
              <span className="font-semibold text-[#222]">Test Report</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-light-gray py-6">
        <div className="container-page space-y-5">
          <div>
            <h1 className="text-lg font-bold text-[#1a1a1a]">Test Report</h1>
            <p className="mt-0.5 text-xs text-gray-text">
              Unit and integration coverage for the SQLite backend and the JSON API.
              Regenerate with <code className="rounded bg-[#f0f0f0] px-1 py-0.5">npm run test:coverage</code>
            </p>
          </div>

          {total === null ? (
            <div className="rounded-md border border-border bg-white px-6 py-14 text-center">
              <i className="fa-solid fa-flask mb-3 text-[26px] text-[#ccc]" />
              <h2 className="mb-1.5 text-[15px] font-bold text-[#1a1a1a]">No coverage data yet</h2>
              <p className="mb-4 text-xs text-gray-text">
                Run <code className="rounded bg-[#f0f0f0] px-1 py-0.5">npm run test:coverage</code>{" "}
                to generate <code className="rounded bg-[#f0f0f0] px-1 py-0.5">coverage/coverage-summary.json</code>.
              </p>
              <p className="text-[11px] text-[#aaa]">
                The numbers come from a build artefact, so they are gitignored and only
                exist on a machine that has run the suite.
              </p>
            </div>
          ) : (
            <>
              <section className="rounded-md border border-border bg-white p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[13px] font-bold text-[#222]">Overall</h2>
                  <span className="text-[11px] text-gray-text">
                    {files.length} files ·{" "}
                    {generatedAt
                      ? `generated ${generatedAt.toISOString().slice(0, 16).replace("T", " ")}`
                      : null}
                  </span>
                </div>

                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {METRICS.map((metric) => (
                    <div key={metric.key} className="flex items-center justify-between gap-4">
                      <span className="w-20 shrink-0 text-[11px] text-gray-text">
                        {metric.label}
                      </span>
                      <CoverageBar value={total[metric.key]} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-border bg-white">
                <h2 className="border-b border-[#f0f0f0] px-5 py-3.5 text-[13px] font-bold text-[#222]">
                  By file
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#f0f0f0] text-[10px] tracking-[0.4px] text-[#999] uppercase">
                        <th className="px-5 py-2.5 font-semibold">File</th>
                        {METRICS.map((metric) => (
                          <th
                            key={metric.key}
                            className="w-[130px] px-3 py-2.5 text-right font-semibold"
                          >
                            {metric.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr
                          key={file.file}
                          className="border-b border-[#f0f0f0] last:border-b-0"
                        >
                          <td className="px-5 py-2.5 font-mono text-[11px] text-[#333]">
                            {file.path}
                          </td>
                          {METRICS.map((metric) => {
                            const value = file.metrics[metric.key];
                            return (
                              <td
                                key={metric.key}
                                className={`px-3 py-2.5 text-right text-[11px] font-semibold ${
                                  value >= TARGET
                                    ? "text-primary"
                                    : value >= 75
                                      ? "text-badge-red"
                                      : "text-[#999]"
                                }`}
                              >
                                {value.toFixed(1)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <p className="text-[11px] text-[#aaa]">
                Statement, function and line coverage are measured with the v8
                provider. Branch coverage is lower because query building has many
                defensive fallbacks for absent or malformed input.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
