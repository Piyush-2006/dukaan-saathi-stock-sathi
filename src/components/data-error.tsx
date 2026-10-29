import type { QueryObserverResult } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DataError({
  error,
  retry,
  title = "Could not load shop data",
}: {
  error: unknown;
  retry: () => Promise<QueryObserverResult> | void;
  title?: string;
}) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while contacting the backend.";
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <WifiOff className="size-5" />
      </span>
      <div>
        <p className="font-medium text-destructive">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => void retry()}>
        Try again
      </Button>
    </div>
  );
}
