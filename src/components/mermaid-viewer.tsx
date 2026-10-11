"use client";

import { useEffect, useId, useState } from "react";

/**
 * Renders Mermaid source and shows the same source as text, one tab at a time.
 *
 * Mermaid is loaded from a CDN as an ES module and rendered in an effect: the
 * library needs a DOM, so it cannot run during server render.
 */

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      render: (id: string, source: string) => Promise<{ svg: string }>;
    };
  }
}

const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

type Tab = "diagram" | "code";

export function MermaidViewer({ source }: { source: string }) {
  const [tab, setTab] = useState<Tab>("diagram");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reactId = useId();
  const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      try {
        // Mermaid is loaded on demand and cached on `window`, so switching tabs
        // does not re-download it.
        if (!window.mermaid) {
          const mermaid = await import(/* webpackIgnore: true */ MERMAID_URL);
          if (cancelled) return;
          mermaid.default.initialize({
            startOnLoad: false,
            theme: "default",
            er: { layout: "elk" },
            fontFamily: "var(--font-prompt), ui-sans-serif, system-ui, sans-serif",
          });
          window.mermaid = mermaid.default as unknown as Window["mermaid"];
        }

        const engine = window.mermaid;
        if (!engine) return;

        const result = await engine.render(renderId, source);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    }

    void draw();
    return () => {
      cancelled = true;
      // Mermaid injects a measurement node it does not always clean up.
      document.getElementById(`d${renderId}`)?.remove();
    };
  }, [renderId, source]);

  const copy = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0f0f0] px-3.5">
        <div role="tablist" aria-label="Diagram or source" className="flex gap-6">
          {(["diagram", "code"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`cursor-pointer border-none bg-transparent px-0 py-3 text-[11px] font-semibold capitalize transition-colors ${
                tab === id
                  ? "border-b-2 border-primary text-[#222]"
                  : "text-gray-text hover:text-primary"
              }`}
            >
              {id === "diagram" ? "ER Diagram" : "Mermaid Code"}
            </button>
          ))}
        </div>

        {tab === "code" ? (
          <button
            type="button"
            onClick={copy}
            className="cursor-pointer rounded border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-[#555] transition-colors hover:border-primary hover:text-primary"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        ) : null}
      </div>

      {tab === "diagram" ? (
        <div className="overflow-x-auto p-5">
          {error ? (
            <div className="rounded border border-badge-red/40 bg-[#fff5f5] p-3 text-[11px] text-badge-red">
              <strong className="mb-1 block">Mermaid failed to render</strong>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          ) : svg ? (
            <div
              className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="flex h-[240px] items-center justify-center text-[11px] text-[#aaa]">
              Loading diagram…
            </div>
          )}
        </div>
      ) : (
        <pre className="max-h-[70vh] overflow-auto p-4 text-[11px] leading-[1.6] text-[#333]">
          <code>{source}</code>
        </pre>
      )}
    </div>
  );
}
