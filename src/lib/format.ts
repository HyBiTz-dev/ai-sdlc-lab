/** Price helpers. The database stores integer cents; the API also exposes a display string. */

/** "$1,240.50" / "38.00" -> 1240.5 */
export function parsePrice(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 1240.5 -> "$1,240.50" (always 2 decimals). */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** 124050 -> "$1,240.50". Prices are stored as integer cents. */
export function formatCents(cents: number): string {
  return formatPrice(cents / 100);
}