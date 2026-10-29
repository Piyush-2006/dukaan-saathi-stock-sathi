import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dayKey, formatINR, formatDayLabel, stockStatus } from "@/lib/format";
import { productsQuery, salesQuery } from "@/lib/queries";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DukaanSaathi AI" },
      {
        name: "description",
        content: "Daily and monthly sales summaries and product performance from real records.",
      },
      { property: "og:title", content: "Reports — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Daily and monthly sales summaries and product performance from real records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const productsQ = useQuery(productsQuery());
  const salesQ = useQuery(salesQuery());

  const products = productsQ.data ?? [];
  const sales = salesQ.data ?? [];

  const report = useMemo(() => {
    const days: { key: string; date: Date; transactions: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const daySales = sales.filter((s) => dayKey(new Date(s.created_at)) === key);
      days.push({
        key,
        date: d,
        transactions: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + s.total_amount, 0),
      });
    }

    const monthKey = (iso: string) => dayKey(new Date(iso)).slice(0, 7);
    const thisMonth = dayKey(new Date()).slice(0, 7);
    const prevMonthDate = new Date();
    prevMonthDate.setDate(1);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = dayKey(prevMonthDate).slice(0, 7);

    const monthStat = (m: string) => {
      const monthSales = sales.filter((s) => monthKey(s.created_at) === m);
      return {
        revenue: monthSales.reduce((sum, s) => sum + s.total_amount, 0),
        count: monthSales.length,
      };
    };

    const byProduct = new Map<number, { units: number; revenue: number }>();
    for (const s of sales) {
      const entry = byProduct.get(s.product_id) ?? { units: 0, revenue: 0 };
      entry.units += s.quantity;
      entry.revenue += s.total_amount;
      byProduct.set(s.product_id, entry);
    }
    const topProducts = Array.from(byProduct.entries())
      .map(([id, v]) => ({
        id,
        name: products.find((p) => p.id === id)?.name ?? `Product #${id}`,
        ...v,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const lowStock = products.filter((p) => stockStatus(p) !== "ok");

    return {
      days,
      thisMonthStat: monthStat(thisMonth),
      prevMonthStat: monthStat(prevMonth),
      topProducts,
      lowStock,
    };
  }, [products, sales]);

  if (productsQ.isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader title="Reports" description="Sales summaries and product performance." />
        <div className="mt-6">
          <DataError error={productsQ.error} retry={() => productsQ.refetch()} />
        </div>
      </div>
    );
  }
  if (salesQ.isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader title="Reports" description="Sales summaries and product performance." />
        <div className="mt-6">
          <DataError error={salesQ.error} retry={() => salesQ.refetch()} />
        </div>
      </div>
    );
  }
  if (productsQ.isLoading || salesQ.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <PageHeader title="Reports" description="Sales summaries and product performance." />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Reports"
        description="Every figure here comes from your recorded sales — nothing is estimated."
      />

      {sales.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="font-medium">No sales to report yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Record sales and daily, monthly and product reports will build up here.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="This month"
              value={formatINR(report.thisMonthStat.revenue)}
              hint={`${report.thisMonthStat.count} transaction${report.thisMonthStat.count === 1 ? "" : "s"}`}
            />
            <MetricCard
              label="Last month"
              value={formatINR(report.prevMonthStat.revenue)}
              hint={`${report.prevMonthStat.count} transaction${report.prevMonthStat.count === 1 ? "" : "s"}`}
            />
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-display text-base font-semibold">Daily sales — last 14 days</h3>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.days} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: Date) => formatDayLabel(d.toISOString())}
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
                    formatter={(value, name) =>
                      name === "revenue"
                        ? [formatINR(Number(value)), "Revenue"]
                        : [String(value), "Transactions"]
                    }
                    labelFormatter={(d: Date) => formatDayLabel(d.toISOString())}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-display text-base font-semibold">Product performance</h3>
              <p className="text-xs text-muted-foreground">Top sellers by recorded revenue</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.units}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatINR(p.revenue)}
                    </TableCell>
                    <TableCell
                      className="text-right text-muted-foreground"
                      title="Cost price is not recorded yet"
                    >
                      —
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="border-t px-5 py-3 text-xs text-muted-foreground">
              Profit cannot be calculated yet because cost price is not recorded. Add a cost-price
              field to unlock profit reports.
            </p>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-display text-base font-semibold">Low-stock insights</h3>
            {report.lowStock.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing needs restocking right now.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {report.lowStock
                  .slice()
                  .sort((a, b) => a.quantity - b.quantity)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.quantity} left · alert at {p.low_stock_threshold}
                      </span>
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
