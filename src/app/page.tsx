import { Header, NavBar } from "@/components/header";
import { Hero } from "@/components/hero";
import { BestSeller, BrowseByCategory, FeaturedBrands, TopSaverToday } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Header />
      <NavBar />
      <main className="flex-1">
        <Hero />
        <BrowseByCategory />
        <FeaturedBrands />
        <TopSaverToday />
        <BestSeller />
      </main>
    </>
  );
}
