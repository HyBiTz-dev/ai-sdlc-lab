import type { NextRequest } from "next/server";
import { getShelfFilters, getShelfProducts } from "@/db/queries";
import { ok } from "@/lib/api";

export function GET(request: NextRequest) {
  const filter = new URL(request.url).searchParams.get("category") ?? undefined;

  return ok({
    shelf: "best-sellers",
    filters: getShelfFilters("best-sellers"),
    items: getShelfProducts("best-sellers", filter),
  });
}
