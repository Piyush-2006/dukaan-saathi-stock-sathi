import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CircleAlert,
  PackagePlus,
  ReceiptText,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataError } from "@/components/data-error";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StockStatusBadge } from "@/components/stock-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKey, formatINR, formatDayLabel, inventoryValue, stockStatus } from "@/lib/format";
import { productsQuery, salesQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DukaanSaathi AI" },
      {
        name: "description",
        content: "Live overview of your shop: stock health, today's sales and inventory value.",
      },
      { property: "og:title", content: "Dashboard — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Live overview of your shop: stock health, today's sales and inventory value.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const productsQ = useQuery(productsQuery());
  const salesQ = useQuery(salesQuery());

  const products = productsQ.data ?? [];
  const sales = salesQ.data ?? [];

  const metrics = useMemo(() => {
    const today = dayKey(new Date());
    const todaySales = sales.filter((s) => dayKey(new Date(s.created_at)) === today);
    const lowStock = products.filter((p) => stockStatus(p) === "low");
    const outStock = products.filter((p) => stockStatus(p) === "out");

    const chart: { day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const revenue = sales
        .filter((s) => dayKey(new Date(s.created_at)) === key)
        .reduce((sum, s) => sum + s.total_amount, 0);
      chart.push({ day: formatDayLabel(d.toISOString()), revenue });
    }

    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outStockCount: outStock.length,
      todayRevenue: todaySales.reduce((sum, s) => sum + s.total_amount, 0),
      todayCount: todaySales.length,
      stockValue: inventoryValue(products),
      lowStock,
      recentSales: sales.slice(0, 8),
      chart,
      today,
    };
  }, [products, sales]);

  const loading = productsQ.isLoading || salesQ.isLoading;
  const longDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Dashboard"
        description="A live picture of your shop — stock health, today's earnings and what needs attention."
      />

      {/* Welcome panel */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Namaste</p>
            <h2 className="mt-1 font-display text-xl font-bold">Your shop at a glance</h2>
            <p className="mt-1 text-sm text-muted-foreground">{longDate} · Indian Standard Time</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/sales">
                <ShoppingCart className="size-4" /> Record sale
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/products" search={{ add: true }}>
                <PackagePlus className="size-4" /> Add product
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {productsQ.isError ? (
        <DataError error={productsQ.error} retry={() => productsQ.refetch()} />
      ) : salesQ.isError ? (
        <DataError error={salesQ.error} retry={() => salesQ.refetch()} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Products"
              value={String(metrics.totalProducts)}
              hint="items in your catalogue"
              icon={<Boxes className="size-4" />}
            />
            <MetricCard
              label="Low stock"
              value={String(metrics.lowStockCount)}
              hint="at or below their threshold"
              icon={<AlertTriangle className="size-4" />}
              tone={metrics.lowStockCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Out of stock"
              value={String(metrics.outStockCount)}
              hint="need restocking now"
              icon={<CircleAlert className="size-4" />}
              tone={metrics.outStockCount > 0 ? "destructive" : "success"}
            />
            <MetricCard
              label="Today's revenue"
              value={formatINR(metrics.todayRevenue)}
              hint={`${metrics.todayCount} transaction${metrics.todayCount === 1 ? "" : "s"} recorded today`}
              icon={<Wallet className="size-4" />}
              tone="success"
            />
            <MetricCard
              label="Today's transactions"
              value={String(metrics.todayCount)}
              hint="sales recorded so far today"
              icon={<ReceiptText className="size-4" />}
            />
            <MetricCard
              label="Inventory value"
              value={formatINR(metrics.stockValue)}
              hint="at current selling prices"
              icon={<Boxes className="size-4" />}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-display text-base font-semibold">Last 7 days revenue</h3>
              <p className="text-xs text-muted-foreground">
                Calculated from recorded sales. Days with no sales show ₹0.
              </p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-popover)",
                        color: "var(--color-popover-foreground)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-display text-base font-semibold">Needs restocking</h3>
              {metrics.lowStock.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  All products are above their low-stock thresholds.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {metrics.lowStock
                    .slice()
                    .sort((a, b) => a.quantity - b.quantity)
                    .slice(0, 6)
                    .map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/products"
                          search={{ add: undefined }}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2 text-sm transition-colors hover:bg-accent"
                        >
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-muted-foreground">{p.quantity} left</span>
                            <StockStatusBadge product={p} />
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Recent sales</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/sales">View all</Link>
              </Button>
            </div>
            {metrics.recentSales.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No sales recorded yet. Use “Record sale” to log your first transaction.
              </p>
            ) : (
              <ul className="mt-3 divide-y">
                {metrics.recentSales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {s.product_name ?? `Product #${s.product_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.quantity} × {formatINR(s.unit_price)} ·{" "}
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        }).format(new Date(s.created_at))}
                      </p>
                    </div>
                    <span className="font-semibold text-success">{formatINR(s.total_amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
