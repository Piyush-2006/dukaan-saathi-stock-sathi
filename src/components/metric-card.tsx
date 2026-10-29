import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "default" && "bg-muted text-muted-foreground",
              tone === "success" && "bg-success/10 text-success",
              tone === "warning" && "bg-warning/10 text-warning",
              tone === "destructive" && "bg-destructive/10 text-destructive",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
