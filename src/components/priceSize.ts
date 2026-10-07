import { formatMoney } from "@/lib/format";

/**
 * Font-size class for the hero price. Each digit renders in a fixed-width cell,
 * so the size steps down by formatted length to keep any amount on one line.
 */
export function priceSizeClass(amount: number): string {
  const len = formatMoney(amount).length; // "$12,999" is 7
  if (len <= 7) return "text-6xl";
  if (len <= 11) return "text-5xl"; // "$13,099,999"
  if (len <= 13) return "text-4xl"; // "$131,000,493"
  return "text-3xl";
}
