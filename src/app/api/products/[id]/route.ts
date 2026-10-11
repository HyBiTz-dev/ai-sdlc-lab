import type { NextRequest } from "next/server";
import { getProduct } from "@/db/queries";
import { fail, ok } from "@/lib/api";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = getProduct(id);

  if (!product) {
    return fail(404, "not_found", `Product "${id}" was not found.`);
  }

  return ok(product);
}
