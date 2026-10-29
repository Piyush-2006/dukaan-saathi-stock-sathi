import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Database, Info, ServerCog } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { healthQuery } from "@/lib/queries";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DukaanSaathi AI" },
      {
        name: "description",
        content: "Backend connection status, API endpoints and app information.",
      },
      { property: "og:title", content: "Settings — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Backend connection status, API endpoints and app information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const ENDPOINTS = [
  { method: "GET", path: "/api/public/health", note: "Connection and database status" },
  { method: "GET", path: "/api/public/products", note: "List all products" },
  { method: "POST", path: "/api/public/products", note: "Add a product" },
  { method: "PATCH", path: "/api/public/products/{id}/stock", note: "Update a product's stock" },
  { method: "GET", path: "/api/public/sales", note: "Sales history" },
  { method: "POST", path: "/api/public/sales", note: "Record a sale (stock deducted in the database)" },
];

function SettingsPage() {
  const healthQ = useQuery(healthQuery());

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Settings"
        description="Connection status, the API this app talks to, and information about this build."
      />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <ServerCog className="size-4 text-primary" /> Backend connection
        </h3>
        {healthQ.isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
        ) : healthQ.isError ? (
          <p className="mt-3 text-sm text-destructive">
            Backend unreachable — the app cannot reach the shop server. Check your connection and
            refresh.
          </p>
        ) : healthQ.data ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{healthQ.data.database ? "Connected" : "Database unreachable"}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2">
              <dt className="text-muted-foreground">Products on record</dt>
              <dd className="font-medium">{healthQ.data.product_count ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2">
              <dt className="text-muted-foreground">Server time (checked)</dt>
              <dd className="font-medium">{formatDateTime(healthQ.data.server_time)}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2">
              <dt className="text-muted-foreground">API version</dt>
              <dd className="font-medium">{healthQ.data.version}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Database className="size-4 text-primary" /> Shop API endpoints
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The frontend uses this same-origin API through its service layer
          {import.meta.env["VITE_API_URL"]
            ? ` (override active: ${import.meta.env["VITE_API_URL"]})`
            : ". Set VITE_API_URL to point it at a different backend."}
        </p>
        <ul className="mt-3 space-y-2">
          {ENDPOINTS.map((e) => (
            <li
              key={`${e.method}-${e.path}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm"
            >
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                {e.method}
              </span>
              <code className="font-mono text-xs">{e.path}</code>
              <span className="ml-auto text-xs text-muted-foreground">{e.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Info className="size-4 text-primary" /> About this build
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>DukaanSaathi AI v1.0.0 — inventory, sales and stock insights for kirana stores.</li>
          <li>
            This build ships with sample inventory and a few sample sales so you can explore
            immediately. Anything you add or record yourself is real data.
          </li>
          <li>
            Not included yet: user accounts, Customer Udhaar storage and AI voice processing — see
            those pages for what's planned.
          </li>
        </ul>
      </section>
    </div>
  );
}
