import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PackagePlus, ShoppingCart, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataError } from "@/components/data-error";
import { PageHeader } from "@/components/page-header";
import { StockStatusBadge } from "@/components/stock-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { dayKey, formatDateTime, formatINR, stockStatus } from "@/lib/format";
import { productsQuery, salesQuery } from "@/lib/queries";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — DukaanSaathi AI" },
      {
        name: "description",
        content: "Record a sale in seconds and review your full sales history.",
      },
      { property: "og:title", content: "Sales — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Record a sale in seconds and review your full sales history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const queryClient = useQueryClient();
  const productsQ = useQuery(productsQuery());
  const salesQ = useQuery(salesQuery());

  const products = useMemo(
    () => (productsQ.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [productsQ.data],
  );
  const sales = salesQ.data ?? [];

  const [productId, setProductId] = useState<string>("");
  const [qty, setQty] = useState("1");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const product = products.find((p) => p.id === Number(productId));
  const qtyInt = Number.parseInt(qty, 10);
  const validQty = Number.isInteger(qtyInt) && qtyInt > 0;
  const overStock = product !== undefined && validQty && qtyInt > product.quantity;
  const total = product && validQty && !overStock ? product.selling_price * qtyInt : 0;
  const canSubmit = product !== undefined && validQty && !overStock;

  const recordMutation = useMutation({
    mutationFn: (payload: { product_id: number; quantity: number }) => api.recordSale(payload),
    onSuccess: async (sale) => {
      toast.success(`Sale recorded — ${formatINR(sale.total_amount)}`, {
        description: "Stock has been updated in your inventory.",
      });
      setConfirmOpen(false);
      setQty("1");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not record the sale");
    },
  });

  const todayStats = useMemo(() => {
    const today = dayKey(new Date());
    const todaySales = sales.filter((s) => dayKey(new Date(s.created_at)) === today);
    return {
      revenue: todaySales.reduce((sum, s) => sum + s.total_amount, 0),
      count: todaySales.length,
    };
  }, [sales]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Sales"
        description="Record a sale in seconds — the bill total is calculated for you and stock updates automatically."
      />

      {productsQ.isError ? (
        <DataError error={productsQ.error} retry={() => productsQ.refetch()} />
      ) : salesQ.isError ? (
        <DataError error={salesQ.error} retry={() => salesQ.refetch()} />
      ) : productsQ.isLoading || salesQ.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="font-medium">No products to sell yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add products to your catalogue first, then record sales here.
          </p>
          <Button asChild className="mt-4">
            <Link to="/products" search={{ add: true }}>
              <PackagePlus className="size-4" /> Add a product
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Record sale */}
          <section className="space-y-4 self-start rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-display text-base font-semibold">Record a sale</h3>

            <div className="grid gap-1.5">
              <Label htmlFor="sale-product">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="sale-product" aria-label="Choose product">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} disabled={p.quantity === 0}>
                      {p.name}
                      {p.quantity === 0 ? " (out of stock)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {product ? (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{formatINR(product.selling_price)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="flex items-center gap-2 font-medium">
                    {product.quantity}
                    <StockStatusBadge product={product} />
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a product to see its price and stock.
              </p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="sale-qty">Quantity</Label>
              <Input
                id="sale-qty"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              {!validQty ? (
                <p className="text-xs text-muted-foreground">Enter a quantity of 1 or more.</p>
              ) : overStock ? (
                <p className="text-xs text-destructive">
                  Only {product?.quantity} available — reduce the quantity.
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm font-medium">Bill total</span>
              <span className="font-display text-xl font-bold text-primary">
                {formatINR(total)}
              </span>
            </div>

            <Button
              className="w-full"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              <ShoppingCart className="size-4" /> Confirm sale
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Stock is deducted by the shop database when the sale is confirmed.
            </p>
          </section>

          {/* History */}
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Today's revenue
                  </span>
                  <Wallet className="size-4 text-success" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {formatINR(todayStats.revenue)}
                </div>
                <p className="text-xs text-muted-foreground">from confirmed sales</p>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Today's transactions
                  </span>
                  <ShoppingCart className="size-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">{todayStats.count}</div>
                <p className="text-xs text-muted-foreground">recorded so far today</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <h3 className="font-display text-base font-semibold">Sales history</h3>
                <p className="text-xs text-muted-foreground">
                  {sales.length} recorded sale{sales.length === 1 ? "" : "s"} · latest first
                </p>
              </div>
              {sales.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No sales recorded yet. Your first sale will appear here.
                </p>
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(0, 50).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDateTime(s.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {s.product_name ?? `Product #${s.product_id}`}
                          </TableCell>
                          <TableCell className="text-right">{s.quantity}</TableCell>
                          <TableCell className="text-right">{formatINR(s.unit_price)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatINR(s.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm this sale?</DialogTitle>
            <DialogDescription>
              Review the bill before recording. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {product && validQty ? (
            <div className="space-y-1.5 rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{qtyInt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit price</span>
                <span className="font-medium">{formatINR(product.selling_price)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="font-medium">Bill total</span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatINR(product.selling_price * qtyInt)}
                </span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <Button
              disabled={recordMutation.isPending}
              onClick={() =>
                recordMutation.mutate({ product_id: Number(productId), quantity: qtyInt })
              }
            >
              {recordMutation.isPending ? "Recording…" : "Record sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
