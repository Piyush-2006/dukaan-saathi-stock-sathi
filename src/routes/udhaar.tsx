import { createFileRoute } from "@tanstack/react-router";
import { Clock, NotebookText, PhoneCall, ReceiptText } from "lucide-react";

import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/udhaar")({
  head: () => ({
    meta: [
      { title: "Customer Udhaar — DukaanSaathi AI" },
      {
        name: "description",
        content: "Track customer credit (udhaar) — coming soon to DukaanSaathi AI.",
      },
      { property: "og:title", content: "Customer Udhaar — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Track customer credit (udhaar) — coming soon to DukaanSaathi AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UdhaarPage,
});

const PLANNED = [
  {
    icon: NotebookText,
    title: "Customer records",
    detail: "Save regular customers with a name and phone number.",
  },
  {
    icon: ReceiptText,
    title: "Outstanding balances",
    detail: "See who owes what at a glance, with the oldest dues first.",
  },
  {
    icon: PhoneCall,
    title: "Repayments",
    detail: "Record part or full repayments against each customer's account.",
  },
  {
    icon: Clock,
    title: "Transaction history",
    detail: "A full ledger per customer — every credit and repayment.",
  },
];

function UdhaarPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Customer Udhaar"
        description="Track credit you give to regular customers and collect it back without a paper notebook."
      />

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
        <p className="font-medium text-warning">Not connected yet</p>
        <p className="mt-1 text-sm text-foreground/80">
          Udhaar tracking is under development. No customer data is stored or shown yet, so this
          page is intentionally empty — nothing here is simulated.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold">What's coming</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PLANNED.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-lg border bg-background/50 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
