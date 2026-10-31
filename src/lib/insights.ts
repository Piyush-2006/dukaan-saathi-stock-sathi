import type { Product, Sale } from "./types";
import { dayKey, formatDayLabel, inventoryValue, stockStatus } from "./format";

/**
 * Shared insight engine for DukaanSaathi AI.
 *
 * Every number here is derived from real product and sales records passed in.
 * Estimates (e.g. inventory value at selling price) are labelled as such by the
 * callers. Pure functions — no fetching, no global state.
 */

export type DailyPoint = { key: string; label: string; revenue: number; transactions: number };

export type WeeklyPoint = { label: string; revenue: number; transactions: number };

export type BestSeller = {
  product: Product;
  units: number;
  revenue: number;
  avgDailyUnits: number;
};

export type SlowMover = {
  product: Product;
  unitsInPeriod: number;
  lastSoldLabel: string | null;
};

export type ReorderSuggestion = {
  product: Product;
  avgDailyUnits: number;
  suggestedUnits: number;
  coverDays: number;
  reason: string;
};

export type IntelligenceReport = {
  periodDays: number;
  startLabel: string;
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  periodRevenue: number;
  periodTransactions: number;
  unitsSoldInPeriod: number;
  bestSellers: BestSeller[];
  slowMovers: SlowMover[];
  lowStock: Product[];
  outOfStock: Product[];
  reorderSuggestions: ReorderSuggestion[];
  /** Sum of selling_price × quantity — an estimate because cost price is not recorded. */
  inventoryValueEstimate: number;
};

export const REORDER_COVER_DAYS = 14;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeIntelligence(
  products: Product[],
  sales: Sale[],
  periodDays: number,
  now: Date = new Date(),
): IntelligenceReport {
  const start = addDays(now, -(periodDays - 1));
  const startKey = dayKey(start);

  const daily: DailyPoint[] = [];
  for (let d = new Date(start); dayKey(d) <= dayKey(now); d = addDays(d, 1)) {
    daily.push({
      key: dayKey(d),
      label: formatDayLabel(d.toISOString()),
      revenue: 0,
      transactions: 0,
    });
  }
  const byKey = new Map(daily.map((p) => [p.key, p]));

  const unitsByProduct = new Map<number, number>();
  const lastSaleByProduct = new Map<number, string>();
  let periodRevenue = 0;
  let periodTransactions = 0;
  let unitsSoldInPeriod = 0;

  for (const s of sales) {
    const key = dayKey(new Date(s.created_at));
    const prevLast = lastSaleByProduct.get(s.product_id);
    if (!prevLast || prevLast < s.created_at) lastSaleByProduct.set(s.product_id, s.created_at);

    const point = byKey.get(key);
    if (!point) continue;
    point.revenue += s.total_amount;
    point.transactions += 1;
    periodRevenue += s.total_amount;
    periodTransactions += 1;
    unitsSoldInPeriod += s.quantity;
    unitsByProduct.set(s.product_id, (unitsByProduct.get(s.product_id) ?? 0) + s.quantity);
  }

  const weekly: WeeklyPoint[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    if (chunk.length === 0) continue;
    weekly.push({
      label: `${chunk[0].label} – ${chunk[chunk.length - 1].label}`,
      revenue: chunk.reduce((sum, c) => sum + c.revenue, 0),
      transactions: chunk.reduce((sum, c) => sum + c.transactions, 0),
    });
  }

  const bestSellers: BestSeller[] = Array.from(unitsByProduct.entries())
    .map(([id, units]) => {
      const product = products.find((p) => p.id === id);
      if (!product) return null;
      const revenue = sales
        .filter((s) => s.product_id === id)
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { product, units, revenue, avgDailyUnits: units / periodDays };
    })
    .filter((b): b is BestSeller => b !== null)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Slow movers only make sense when there is sales history at all.
  const slowMovers: SlowMover[] =
    sales.length === 0
      ? []
      : products
          .filter((p) => (unitsByProduct.get(p.id) ?? 0) === 0)
          .map((p) => {
            const last = lastSaleByProduct.get(p.id);
            return {
              product: p,
              unitsInPeriod: 0,
              lastSoldLabel: last ? formatDayLabel(last) : null,
            };
          })
          .sort((a, b) => {
            const aLast = lastSaleByProduct.get(a.product.id) ?? "";
            const bLast = lastSaleByProduct.get(b.product.id) ?? "";
            return aLast.localeCompare(bLast);
          });

  const lowStock = products.filter((p) => stockStatus(p) === "low");
  const outOfStock = products.filter((p) => stockStatus(p) === "out");

  const reorderSuggestions: ReorderSuggestion[] = bestSellers
    .map((b) => {
      const target = Math.ceil(b.avgDailyUnits * REORDER_COVER_DAYS);
      const gap = target - b.product.quantity;
      if (gap <= 0) return null;
      return {
        product: b.product,
        avgDailyUnits: b.avgDailyUnits,
        suggestedUnits: gap,
        coverDays: REORDER_COVER_DAYS,
        reason: `Selling about ${round1(b.avgDailyUnits)} units/day over the last ${periodDays} days. With ${b.product.quantity} in stock, ordering ${gap} covers ~${REORDER_COVER_DAYS} days.`,
      };
    })
    .filter((r): r is ReorderSuggestion => r !== null)
    .sort((a, b) => b.suggestedUnits - a.suggestedUnits);

  return {
    periodDays,
    startLabel: formatDayLabel(start.toISOString()),
    daily,
    weekly,
    periodRevenue,
    periodTransactions,
    unitsSoldInPeriod,
    bestSellers,
    slowMovers,
    lowStock,
    outOfStock,
    reorderSuggestions,
    inventoryValueEstimate: inventoryValue(products),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------- briefing

export type BriefingRecommendation = {
  title: string;
  detail: string;
  /** Where the number comes from — shown to the shopkeeper for traceability. */
  source: string;
};

export type Briefing = {
  todayKey: string;
  todayRevenue: number;
  todayTransactions: number;
  yesterdayRevenue: number;
  yesterdayTransactions: number;
  comparison: { direction: "up" | "down" | "flat"; delta: number } | null;
  recommendations: BriefingRecommendation[];
};

export function buildBriefing(
  products: Product[],
  sales: Sale[],
  now: Date = new Date(),
): Briefing {
  const today = dayKey(now);
  const yesterday = dayKey(addDays(now, -1));
  const todaySales = sales.filter((s) => dayKey(new Date(s.created_at)) === today);
  const yesterdaySales = sales.filter((s) => dayKey(new Date(s.created_at)) === yesterday);

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total_amount, 0);

  const comparison: Briefing["comparison"] =
    todaySales.length === 0 && yesterdaySales.length === 0
      ? null
      : {
          direction:
            todayRevenue === yesterdayRevenue ? "flat" : todayRevenue > yesterdayRevenue ? "up" : "down",
          delta: todayRevenue - yesterdayRevenue,
        };

  const recommendations: BriefingRecommendation[] = [];

  const outOfStock = products.filter((p) => p.quantity <= 0);
  if (outOfStock.length > 0) {
    recommendations.push({
      title: `Restock ${joinNames(outOfStock)}`,
      detail: "These items have zero stock right now — customers asking for them are walking away.",
      source: `stock count is 0 for ${outOfStock.length} product${outOfStock.length === 1 ? "" : "s"}`,
    });
  }

  const lowStock = products.filter((p) => p.quantity > 0 && stockStatus(p) === "low");
  if (lowStock.length > 0) {
    const first = lowStock.slice().sort((a, b) => a.quantity - b.quantity)[0];
    recommendations.push({
      title: `Order stock for ${joinNames(lowStock)}`,
      detail: `${first.name} has ${first.quantity} left and its low-stock alert is set at ${first.low_stock_threshold}.`,
      source: `stock levels are at or below each product's alert threshold`,
    });
  }

  // Products with no sale in the last 7 days, when there is sales history.
  if (sales.length > 0) {
    const sevenDaysAgo = dayKey(addDays(now, -6));
    const soldRecently = new Set(
      sales
        .filter((s) => dayKey(new Date(s.created_at)) >= sevenDaysAgo)
        .map((s) => s.product_id),
    );
    const quiet = products.filter((p) => !soldRecently.has(p.id));
    if (quiet.length > 0) {
      recommendations.push({
        title: `No sales of ${joinNames(quiet)} this week`,
        detail:
          quiet.length === 1
            ? `${quiet[0].name} hasn't sold in the last 7 days — check its price, display spot, or stock quality.`
            : `${quiet.length} products haven't sold in the last 7 days — check their price or display spot.`,
        source: "0 recorded sales for these products between 7 days ago and today",
      });
    }
  }

  // Today's best seller, as a positive/grounding recommendation.
  if (todaySales.length > 0) {
    const unitsByProduct = new Map<number, number>();
    for (const s of todaySales) {
      unitsByProduct.set(s.product_id, (unitsByProduct.get(s.product_id) ?? 0) + s.quantity);
    }
    const topId = Array.from(unitsByProduct.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const top = products.find((p) => p.id === topId);
    if (top) {
      recommendations.push({
        title: `Today's top seller: ${top.name}`,
        detail: `${unitsByProduct.get(topId)} unit${unitsByProduct.get(topId) === 1 ? "" : "s"} sold today out of ${todaySales.length} transaction${todaySales.length === 1 ? "" : "s"}.`,
        source: "today's recorded sales",
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Stock looks healthy",
      detail: "Nothing is at or below its low-stock alert level.",
      source: "every product is above its alert threshold",
    });
    if (sales.length === 0) {
      recommendations.push({
        title: "Record your first sale today",
        detail: "Daily briefings, reports and restocking advice all build up from recorded sales.",
        source: "no sales recorded yet",
      });
    }
  }

  return {
    todayKey: today,
    todayRevenue,
    todayTransactions: todaySales.length,
    yesterdayRevenue,
    yesterdayTransactions: yesterdaySales.length,
    comparison,
    recommendations: recommendations.slice(0, 3),
  };
}

function joinNames(products: Product[]): string {
  const names = products.map((p) => p.name);
  if (names.length === 1) return names[0];
  if (names.length <= 3) {
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

// ---------------------------------------------------------------- close shop

export type CloseShopSummary = {
  dayKey: string;
  revenue: number;
  transactions: number;
  itemsSold: number;
  bestSellers: { name: string; units: number; revenue: number }[];
  lowStock: Product[];
  outOfStock: Product[];
  replenishTomorrow: ReorderSuggestion[];
};

export function buildCloseShopSummary(
  products: Product[],
  sales: Sale[],
  now: Date = new Date(),
): CloseShopSummary {
  const today = dayKey(now);
  const todaySales = sales.filter((s) => dayKey(new Date(s.created_at)) === today);

  const byProduct = new Map<number, { units: number; revenue: number }>();
  for (const s of todaySales) {
    const entry = byProduct.get(s.product_id) ?? { units: 0, revenue: 0 };
    entry.units += s.quantity;
    entry.revenue += s.total_amount;
    byProduct.set(s.product_id, entry);
  }
  const bestSellers = Array.from(byProduct.entries())
    .map(([id, v]) => ({
      name: products.find((p) => p.id === id)?.name ?? `Product #${id}`,
      ...v,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const { reorderSuggestions } = computeIntelligence(products, sales, 30, now);

  return {
    dayKey: today,
    revenue: todaySales.reduce((sum, s) => sum + s.total_amount, 0),
    transactions: todaySales.length,
    itemsSold: todaySales.reduce((sum, s) => sum + s.quantity, 0),
    bestSellers,
    lowStock: products.filter((p) => stockStatus(p) === "low"),
    outOfStock: products.filter((p) => stockStatus(p) === "out"),
    replenishTomorrow: reorderSuggestions.slice(0, 5),
  };
}
