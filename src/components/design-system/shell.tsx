import type { ReactNode } from "react";

/** Page frame: canvas background + the 1200px container from DESIGN.md. */
export function Spec({
  children,
  tone = "canvas",
}: {
  children: ReactNode;
  tone?: "canvas" | "surface" | "band";
}) {
  const bg = tone === "band" ? "bg-[#f4f5f7]" : tone === "surface" ? "bg-white" : "bg-[#fbfbfb]";
  return <div className={`${bg} py-10`}>{children}</div>;
}

export function Section({
  id,
  title,
  lead,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-6 last:mb-0">
      <div className="mb-1 text-lg leading-7 font-bold text-[#1a1a1a]">{title}</div>
      {lead ? <p className="mb-4 max-w-3xl text-xs leading-5 text-[#71717a]">{lead}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#ebebeb] bg-white p-5 ${className}`}>{children}</div>
  );
}

/** One row in a token table. */
export function SpecRow({
  token,
  detail,
  preview,
}: {
  token: string;
  detail: string;
  preview?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-2 last:border-b-0">
      <div className="min-w-0">
        <code className="block text-[11px] font-semibold text-[#222]">{token}</code>
        <span className="block text-[11px] text-[#71717a]">{detail}</span>
      </div>
      <div className="shrink-0">{preview}</div>
    </div>
  );
}

export function Hex({ value }: { value: string }) {
  return (
    <code className="rounded-sm border border-[#ebebeb] bg-white px-1.5 py-0.5 text-[10px] text-[#71717a]">
      {value}
    </code>
  );
}

export function SwatchGrid({ items }: { items: { token: string; hex: string; role: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.token} className="overflow-hidden rounded-lg border border-[#ebebeb] bg-white">
          <div className="h-14" style={{ background: item.hex }} />
          <div className="p-2.5">
            <code className="block text-[10px] font-semibold text-[#222]">{item.token}</code>
            <Hex value={item.hex} />
            <p className="mt-1.5 text-[10px] leading-[1.5] text-[#71717a]">{item.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}