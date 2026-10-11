import type { NextRequest } from "next/server";
import { getCategory, searchProducts } from "@/db/queries";
import { fail, ok, pickParam } from "@/lib/api";
import { SORT_KEYS } from "@/lib/sorts";

export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const category = getCategory(name);

  if (!category) {
    return fail(404, "not_found", `Category "${name}" was not found.`);
  }

  const { searchParams } = new URL(request.url);
  const result = searchProducts({
    category: category.label,
    sort: pickParam(searchParams, "sort", SORT_KEYS),
    page: Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    limit: Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12,
  });

  return ok({ category, ...result });
}
