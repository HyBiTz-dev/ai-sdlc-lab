import type { NextRequest } from "next/server";
import { getProduct, getRelatedProducts } from "@/db/queries";
import { fail, ok } from "@/lib/api";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getProduct(id)) {
    return fail(404, "not_found", `Product "${id}" was not found.`);
  }

  const requested = Number.parseInt(new URL(request.url).searchParams.get("limit") ?? "6", 10);
  const limit = Math.min(24, Math.max(1, Number.isFinite(requested) ? requested : 6));

  return ok({ id, items: getRelatedProducts(id, limit) });
}
