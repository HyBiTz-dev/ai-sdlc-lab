import { describe, expect, it } from "vitest";
import { formatCents, formatPrice, parsePrice } from "@/lib/format";

/**
 * `parsePrice` still exists for reading display strings, but the database
 * stores cents, so `formatCents` is the path everything actually uses now.
 */

describe("formatCents", () => {
  it("renders integer cents as currency", () => {
    expect(formatCents(475)).toBe("$4.75");
    expect(formatCents(3800)).toBe("$38.00");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("groups thousands and always shows two decimals", () => {
    expect(formatCents(124050)).toBe("$1,240.50");
    // A whole-dollar amount keeps its decimals, unlike the old display strings.
    expect(formatCents(2100)).toBe("$21.00");
  });

  it("round-trips through parsePrice", () => {
    for (const cents of [0, 5, 99, 475, 3800, 124050]) {
      expect(parsePrice(formatCents(cents))).toBeCloseTo(cents / 100, 10);
    }
  });
});

describe("formatPrice", () => {
  it("formats a plain number the same way", () => {
    expect(formatPrice(4.75)).toBe("$4.75");
    expect(formatPrice(1240.5)).toBe("$1,240.50");
  });
});

describe("parsePrice", () => {
  it("strips the currency symbol", () => {
    expect(parsePrice("$38.00")).toBe(38);
    expect(parsePrice("$1,240.50")).toBe(1240.5);
  });

  it("returns 0 rather than NaN for unparseable input", () => {
    expect(parsePrice("free")).toBe(0);
    expect(parsePrice("")).toBe(0);
  });
});
