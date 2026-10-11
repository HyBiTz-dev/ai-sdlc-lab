import { listCategories } from "@/db/queries";
import { ok } from "@/lib/api";

export function GET() {
  return ok({ items: listCategories() });
}
