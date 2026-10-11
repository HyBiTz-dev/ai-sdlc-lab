import { Suspense } from "react";
import { SearchBar, SearchBarFallback } from "@/components/search-bar";
import { getCategories } from "@/lib/data";

/** Category list for the search dropdown. */
async function HeaderSearch() {
  return <SearchBar categories={await getCategories()} />;
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
      {count}
    </span>
  );
}

export function Header() {
  return (
    <header className="bg-white">
      <div className="container-page">
        <div className="flex flex-col items-center gap-5 py-6 md:flex-row md:gap-14">
          <a href="#" className="flex shrink-0 items-center gap-2 text-2xl font-bold text-[#1a1a1a]">
            <i className="fa-solid fa-basket-shopping text-[26px] text-primary" />
            Farmart
          </a>

          <Suspense fallback={<SearchBarFallback />}>
            <HeaderSearch />
          </Suspense>

          <div className="hidden shrink-0 text-right sm:flex sm:flex-col">
            <strong className="text-[15px] font-bold text-[#111]">8 800 332 65-66</strong>
            <span className="text-[11px] text-gray-text">Support 24/7</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-6">
              <div className="cursor-pointer">
                <i className="fa-regular fa-user text-xl" />
              </div>
              <span className="relative cursor-pointer">
                <i className="fa-regular fa-heart text-xl" />
                <CountBadge count={3} />
              </span>
              <div className="flex cursor-pointer items-center gap-2.5">
                <span className="relative">
                  <i className="fa-solid fa-bag-shopping text-xl" />
                  <CountBadge count={5} />
                </span>
                <div className="flex flex-col text-xs">
                  <span className="text-[10px] text-gray-text">Your Cart</span>
                  <strong className="text-[15px] font-bold">$1,240.50</strong>
                </div>
              </div>
            </div>
        </div>
      </div>
    </header>
  );
}

const navLinks = [
  { label: "Deals Today", icon: "fa-solid fa-bolt", highlight: true },
  { label: "Special Prices" },
  { label: "Fresh" },
  { label: "Frozen" },
  { label: "Demo", caret: true },
  { label: "Shop", caret: true },
  { label: "Blog", caret: true },
  { label: "Pages", caret: true },
];

export function NavBar() {
  return (
    <div className="bg-white">
      <div className="container-page flex items-center justify-between overflow-x-auto">
        <div className="flex items-center">
          <div className="flex w-[220px] shrink-0 cursor-pointer items-center justify-between rounded-t bg-primary py-3 pl-5 pr-5 font-semibold text-white max-lg:w-auto">
            <span className="whitespace-nowrap">
              <i className="fa-solid fa-bars mr-2" />
              SHOP BY CATEGORY
            </span>
            <i className="fa-solid fa-chevron-down text-xs" />
          </div>
          <ul className="ml-6 flex list-none gap-7 text-[13px] font-medium max-lg:hidden">
            {navLinks.map((link) => (
              <li key={link.label} className={link.highlight ? "text-badge-red" : undefined}>
                <a href="#" className="flex items-center gap-1 whitespace-nowrap text-[#333]">
                  {link.icon ? <i className={link.icon} /> : null}
                  {link.label}
                  {link.caret ? <i className="fa-solid fa-chevron-down text-[9px]" /> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden cursor-pointer items-center gap-1.5 text-xs text-gray-text lg:flex">
          <i className="fa-regular fa-clock" /> Recently Viewed
        </div>
      </div>
    </div>
  );
}