import Link from "next/link";

export type Crumb = {
  label: string;
  /** omit on the current page — the last crumb is never a link */
  href?: string;
};

/**
 * `breadcrumb` — 12px trail in `{typography.body-small}`, hairline-soft
 * separation from the band below. No new token: it reuses `{colors.ink-muted}`
 * for links and `{colors.ink-body}` for the current page.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-text">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#333]">{item.label}</span>
              )}
              {isLast ? null : (
                <i className="fa-solid fa-chevron-right text-[8px] text-[#aaa]" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}