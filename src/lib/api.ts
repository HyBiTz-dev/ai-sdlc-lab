import { NextResponse } from "next/server";

/** Shared helpers for the JSON API routes under `/api`. */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Uniform error envelope so every failure reads the same in Swagger. */
export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Reads a query param and falls back when it is absent or not one of `allowed`. */
export function pickParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = searchParams.get(key);
  return allowed.find((entry) => entry.toLowerCase() === value?.toLowerCase());
}
