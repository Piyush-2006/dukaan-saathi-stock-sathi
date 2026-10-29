import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { healthQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function BackendStatus() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(healthQuery());
  const [refreshing, setRefreshing] = useState(false);

  const state: "checking" | "up" | "degraded" | "down" = isLoading
    ? "checking"
    : isError
      ? "down"
      : data?.database
        ? "up"
        : "degraded";

  const label =
    state === "up"
      ? "Backend connected"
      : state === "checking"
        ? "Checking backend…"
        : state === "degraded"
          ? "Database unreachable"
          : "Backend unreachable";

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          state === "up" && "border-success/25 bg-success/10 text-success",
          state === "checking" && "border-border bg-muted text-muted-foreground",
          state === "degraded" && "border-warning/30 bg-warning/10 text-warning",
          state === "down" && "border-destructive/25 bg-destructive/10 text-destructive",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            state === "up" && "bg-success",
            state === "checking" && "animate-pulse bg-muted-foreground",
            state === "degraded" && "bg-warning",
            state === "down" && "bg-destructive",
          )}
        />
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleRefresh}
        aria-label="Refresh shop data"
        disabled={refreshing}
      >
        <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
      </Button>
    </div>
  );
}
