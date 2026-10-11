import { ok } from "@/lib/api";

export function GET() {
  return ok({ message: "Hello World!" });
}
