import type { Product, StockStatus } from "@/lib/types";
import { STOCK_STATUS_LABEL, stockStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StockStatusBadge({
  product,
  status,
  className,
}: {
  product?: Product;
  status?: StockStatus;
  className?: string;
}) {
  const resolved = status ?? (product ? stockStatus(product) : "ok");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        resolved === "ok" && "border-success/25 bg-success/10 text-success",
        resolved === "low" && "border-warning/30 bg-warning/10 text-warning",
        resolved === "out" && "border-destructive/25 bg-destructive/10 text-destructive",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          resolved === "ok" && "bg-success",
          resolved === "low" && "bg-warning",
          resolved === "out" && "bg-destructive",
        )}
      />
      {STOCK_STATUS_LABEL[resolved]}
    </span>
  );
}
