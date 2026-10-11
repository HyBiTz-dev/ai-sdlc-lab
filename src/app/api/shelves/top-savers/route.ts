import { getShelfProducts } from "@/db/queries";
import { ok } from "@/lib/api";

export function GET() {
  return ok({ shelf: "top-savers", items: getShelfProducts("top-savers") });
}
