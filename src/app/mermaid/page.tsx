import type { Metadata } from "next";
import Link from "next/link";
import { MermaidViewer } from "@/components/mermaid-viewer";
import { mermaidErSource, readSchema } from "@/lib/mermaid";

export const metadata: Metadata = {
  title: "Database Schema - Farmart",
  description: "ER diagram of the Farmart SQLite database.",
};

export default function MermaidPage() {
  const source = mermaidErSource();
  const { tables } = readSchema();
  const columnCount = tables.reduce((total, table) => total + table.columns.length, 0);
  const relationCount = tables.reduce(
    (total, table) => total + table.foreignKeys.length,
    0,
  );

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
              <Link href="/design" className="hover:text-primary">
                Design System
              </Link>
              <span className="font-semibold text-[#222]">Database Schema</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-light-gray py-6">
        <div className="container-page">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">Database Schema</h1>
              <p className="mt-0.5 text-xs text-gray-text">
                Generated from the live SQLite schema, so it cannot drift from{" "}
                <code className="rounded bg-[#f0f0f0] px-1 py-0.5">src/db/schema.ts</code>
              </p>
            </div>
            <div className="flex gap-4 text-[11px] text-gray-text">
              <span>
                <strong className="text-[#222]">{tables.length}</strong> tables
              </span>
              <span>
                <strong className="text-[#222]">{columnCount}</strong> columns
              </span>
              <span>
                <strong className="text-[#222]">{relationCount}</strong> relations
              </span>
            </div>
          </div>

          <MermaidViewer source={source} />
        </div>
      </main>
    </>
  );
}
