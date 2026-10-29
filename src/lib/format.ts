import type { Product, StockStatus } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function formatDayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

/** Calendar-day key in the shop's own timezone (IST), e.g. "2026-10-29". */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

/** Stock state derived from the product's own low-stock threshold. */
export function stockStatus(product: Pick<Product, "quantity" | "low_stock_threshold">): StockStatus {
  if (product.quantity <= 0) return "out";
  if (product.quantity <= product.low_stock_threshold) return "low";
  return "ok";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  ok: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

export function inventoryValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
}
