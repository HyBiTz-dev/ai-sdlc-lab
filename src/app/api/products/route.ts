import type { NextRequest } from "next/server";
import { searchProducts } from "@/db/queries";
import { ok, pickParam } from "@/lib/api";
import { SORT_KEYS } from "@/lib/sorts";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = pickParam(searchParams, "sort", SORT_KEYS);

  const result = searchProducts({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    sort,
    onSale: searchParams.get("onSale") === "true",
    page: Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    limit: Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12,
  });

  return ok(result);
}
