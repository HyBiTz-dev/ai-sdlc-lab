import { ok } from "@/lib/api";
import { openApiSpec } from "@/lib/openapi";

export function GET() {
  return ok(openApiSpec);
}
