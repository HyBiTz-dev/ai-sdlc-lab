import Link from "next/link";
import { Header, NavBar } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <NavBar />
      <main className="flex flex-1 items-center justify-center bg-white py-20">
        <div className="container-page flex flex-col items-center text-center">
          <i className="fa-solid fa-basket-shopping mb-4 text-[40px] text-primary" />
          <h1 className="mb-1.5 text-[24px] leading-[1.25] font-bold text-[#1a1a1a]">
            Product Not Found
          </h1>
          <p className="mb-5 max-w-md text-xs leading-5 text-gray-text">
            This product may have sold out or the link is no longer valid. Browse the shelves
            to find something fresh instead.
          </p>
          <Link
            href="/"
            className="rounded bg-primary px-5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Back To Home
          </Link>
        </div>
      </main>
    </>
  );
}