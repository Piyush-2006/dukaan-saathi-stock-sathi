import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Minus, PackagePlus, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { formatDateTime, formatINR, stockStatus } from "@/lib/format";
import { productsQuery } from "@/lib/queries";
import type { Product } from "@/lib/types";

const searchSchema = z.object({ add: z.boolean().optional() });

export const Route = createFileRoute("/products")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Products & Stock — DukaanSaathi AI" },
      {
        name: "description",
        content: "Add products, update stock levels and spot low or out-of-stock items.",
      },
      { property: "og:title", content: "Products & Stock — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Add products, update stock levels and spot low or out-of-stock items.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const productsQ = useQuery(productsQuery());

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const addRequested = search.add === true;
  const dialogOpen = addOpen || addRequested;

  function setDialogOpen(open: boolean) {
    setAddOpen(open);
    if (!open && addRequested) {
      void navigate({ to: "/products", search: {} });
    }
  }

  const filtered = useMemo(() => {
    const products = productsQ.data ?? [];
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [productsQ.data, query]);

  const counts = useMemo(() => {
    const products = productsQ.data ?? [];
    return {
      low: products.filter((p) => stockStatus(p) === "low").length,
      out: products.filter((p) => stockStatus(p) === "out").length,
    };
  }, [productsQ.data]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Products & Stock"
        description="Your catalogue and current stock levels. Update quantities as deliveries arrive."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <PackagePlus className="size-4" /> Add product
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        {!productsQ.isLoading && !productsQ.isError ? (
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {productsQ.data?.length ?? 0} products
            {counts.low > 0 ? ` · ${counts.low} low` : ""}
            {counts.out > 0 ? ` · ${counts.out} out of stock` : ""}
          </p>
        ) : null}
      </div>

      {productsQ.isError ? (
        <DataError error={productsQ.error} retry={() => productsQ.refetch()} />
      ) : productsQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="font-medium">
            {query ? "No products match your search" : "No products yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? "Try a different name."
              : "Add your first product to start tracking stock and sales."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Selling price</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <ProductRow key={p.id} product={p} onStock={() => setStockProduct(p)} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onStock={() => setStockProduct(p)} />
            ))}
          </div>
        </>
      )}

      <AddProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />
      <StockDialog
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />
    </div>
  );
}

function ProductRow({ product, onStock }: { product: Product; onStock: () => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="text-right">{formatINR(product.selling_price)}</TableCell>
      <TableCell className="text-right">{product.quantity}</TableCell>
      <TableCell>
        <StockStatusBadge product={product} />
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDateTime(product.updated_at)}</TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={onStock}>
          Update stock
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ProductCard({ product, onStock }: { product: Product; onStock: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{product.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatINR(product.selling_price)} · {product.quantity} in stock
          </p>
        </div>
        <StockStatusBadge product={product} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Updated {formatDateTime(product.updated_at)}
        </span>
        <Button variant="outline" size="sm" onClick={onStock}>
          Update stock
        </Button>
      </div>
    </div>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName("");
      setPrice("");
      setQuantity("");
      setThreshold("5");
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      selling_price: number;
      quantity: number;
      low_stock_threshold: number;
    }) => api.createProduct(payload),
    onSuccess: async (product) => {
      toast.success(`“${product.name}” added to your catalogue`);
      await onSaved();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not add the product");
    },
  });

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Product name is required";
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      next.price = "Enter a selling price greater than zero";
    }
    const qtyNum = Number(quantity);
    if (!quantity || !Number.isInteger(qtyNum) || qtyNum < 0) {
      next.quantity = "Enter a whole number of 0 or more";
    }
    const thNum = Number(threshold);
    if (!threshold || !Number.isInteger(thNum) || thNum < 0) {
      next.threshold = "Enter a whole number of 0 or more";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    mutation.mutate({
      name: name.trim(),
      selling_price: priceNum,
      quantity: qtyNum,
      low_stock_threshold: thNum,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Add an item to your catalogue with its price and current stock.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aashirvaad Atta 5kg"
              autoFocus
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="product-price">Selling price (₹)</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 245"
            />
            {errors.price ? <p className="text-xs text-destructive">{errors.price}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="product-qty">Quantity in stock</Label>
              <Input
                id="product-qty"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 20"
              />
              {errors.quantity ? <p className="text-xs text-destructive">{errors.quantity}</p> : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="product-threshold">Low-stock alert at</Label>
              <Input
                id="product-threshold"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              {errors.threshold ? (
                <p className="text-xs text-destructive">{errors.threshold}</p>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Add product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StockDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [qty, setQty] = useState("0");

  useEffect(() => {
    if (product) setQty(String(product.quantity));
  }, [product]);

  const mutation = useMutation({
    mutationFn: (args: { productId: number; quantity: number }) =>
      api.updateStock(args.productId, { quantity: args.quantity }),
    onSuccess: async (updated) => {
      toast.success(`Stock updated — ${updated.name}: ${updated.quantity} in stock`);
      await onSaved();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update stock");
    },
  });

  function adjust(delta: number) {
    const current = Number.parseInt(qty, 10);
    if (Number.isNaN(current)) {
      setQty(String(Math.max(0, delta)));
      return;
    }
    setQty(String(Math.max(0, current + delta)));
  }

  const parsed = Number.parseInt(qty, 10);
  const valid = product !== null && Number.isInteger(parsed) && parsed >= 0;
  const unchanged = product !== null && parsed === product.quantity;

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription>
            {product ? `Set the current stock level for ${product.name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        {product ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current stock</span>
                <span className="font-medium">{product.quantity}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Selling price</span>
                <span className="font-medium">{formatINR(product.selling_price)}</span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="stock-qty">New quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjust(-5)}
                  aria-label="Decrease by 5"
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjust(-1)}
                  aria-label="Decrease by 1"
                >
                  <Minus className="size-3" />
                </Button>
                <Input
                  id="stock-qty"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjust(1)}
                  aria-label="Increase by 1"
                >
                  <Plus className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjust(5)}
                  aria-label="Increase by 5"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {!valid ? <p className="text-xs text-destructive">Enter a whole number of 0 or more</p> : null}
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || unchanged || mutation.isPending}
            onClick={() => product && mutation.mutate({ productId: product.id, quantity: parsed })}
          >
            {mutation.isPending ? "Saving…" : "Save stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
