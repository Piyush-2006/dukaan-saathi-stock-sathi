import { convertToModelMessages, type UIMessage } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getShopDb } from "@/lib/server/shop-db";
import { createResponsesCall } from "@/lib/server/ai/responses";

/**
 * AI Business Copilot — streaming chat endpoint.
 *
 * The model sees a compact snapshot of the shop's real products and sales
 * (read server-side with the publishable key, public tables only). No API key
 * or database credential ever reaches the browser.
 */

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev";
const MODEL = "openai/gpt-6-astra";

const bodySchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.enum(["user", "assistant"]),
          parts: z.array(z.unknown()).min(1),
        })
        .passthrough(),
    )
    .min(1)
    .max(60),
});

async function loadShopSnapshot(): Promise<string> {
  const db = getShopDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [productsRes, salesRes] = await Promise.all([
    db
      .from("products")
      .select("id,name,selling_price,quantity,low_stock_threshold")
      .order("name")
      .limit(200),
    db
      .from("sales")
      .select("id,product_id,quantity,unit_price,total_amount,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  if (productsRes.error || salesRes.error) {
    throw new Error("Could not read shop data for the Copilot");
  }

  const products = productsRes.data ?? [];
  const sales = salesRes.data ?? [];
  const nowIst = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const lines: string[] = [`Snapshot time (IST): ${nowIst}. Currency: INR (₹).`];
  lines.push(
    `Products (${products.length}): name | stock | low-stock alert at | selling price ₹`,
  );
  for (const p of products) {
    lines.push(`- ${p.name} | ${p.quantity} | ${p.low_stock_threshold} | ${p.selling_price}`);
  }

  if (sales.length === 0) {
    lines.push("Sales: none recorded in the last 30 days.");
  } else {
    const revenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const units = sales.reduce((sum, s) => sum + s.quantity, 0);
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
      new Date(),
    );
    const todaySales = sales.filter(
      (s) =>
        new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
          new Date(s.created_at),
        ) === todayKey,
    );
    lines.push(
      `Sales, last 30 days: ${sales.length} transactions, ₹${revenue} revenue, ${units} units.`,
    );
    lines.push(
      todaySales.length === 0
        ? "Today (so far): no transactions recorded."
        : `Today (so far): ${todaySales.length} transactions, ₹${todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)} revenue.`,
    );

    const byProduct = new Map<number, { name: string; units: number; revenue: number }>();
    for (const s of sales) {
      const entry = byProduct.get(s.product_id) ?? {
        name: products.find((p) => p.id === s.product_id)?.name ?? `Product #${s.product_id}`,
        units: 0,
        revenue: 0,
      };
      entry.units += s.quantity;
      entry.revenue += Number(s.total_amount);
      byProduct.set(s.product_id, entry);
    }
    const top = Array.from(byProduct.values()).sort((a, b) => b.units - a.units).slice(0, 10);
    lines.push(
      `Top sellers by units (30 days): ${top.map((t) => `${t.name} — ${t.units} units, ₹${t.revenue}`).join("; ")}`,
    );
    const neverSold = products.filter((p) => !byProduct.has(p.id)).map((p) => p.name);
    if (neverSold.length > 0) {
      lines.push(`No sales in 30 days: ${neverSold.join(", ")}`);
    }
  }

  return lines.join("\n");
}

function systemPrompt(snapshot: string): string {
  return [
    "You are DukaanSaathi Copilot, the business assistant inside DukaanSaathi AI, used by the owner of a small Indian kirana shop.",
    "",
    "Rules:",
    "- Ground every figure in the SHOP DATA SNAPSHOT below. Never invent products, prices, sales or forecasts.",
    "- Always state the period you are using (e.g. \"last 30 days\") and quote the key figures you relied on.",
    "- Use ₹ amounts. Keep answers short, warm and practical; prefer bullet points and simple language.",
    "- Reply in the same language as the user's question (English, Hindi, or Hinglish).",
    "- You can only read shop data. You cannot change stock or record sales — direct the owner to the Sales or Products pages for that.",
    "- If the snapshot lacks data for a question, say exactly what is missing and what the owner should record.",
    "- When suggesting restocking, show the calculation (e.g. average daily sales × two weeks of cover).",
    "",
    "SHOP DATA SNAPSHOT (single shop):",
    snapshot,
  ].join("\n");
}

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "Invalid chat messages" }, { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "The AI assistant is not configured on the server yet." },
            { status: 500 },
          );
        }

        try {
          const snapshot = await loadShopSnapshot();
          const modelMessages = await convertToModelMessages(
            parsed.data.messages as unknown as UIMessage[],
          );
          const { response } = createResponsesCall(
            request,
            { baseURL: GATEWAY_BASE_URL, apiKey, model: MODEL },
            modelMessages,
            systemPrompt(snapshot),
          );
          return response();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unexpected error";
          if (message.includes("Could not read shop data")) {
            return Response.json(
              { error: "Could not read your shop data. Please try again." },
              { status: 502 },
            );
          }
          return Response.json(
            { error: "The AI assistant could not start. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
