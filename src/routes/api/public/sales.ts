import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getShopDb } from "@/lib/server/shop-db";
import type { Sale } from "@/lib/types";

const recordSaleSchema = z.object({
  product_id: z.coerce
    .number({ message: "Choose a product" })
    .int()
    .positive("Choose a product"),
  quantity: z.coerce
    .number({ message: "Quantity must be a whole number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1"),
});

function saleRow(row: {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
  product_name?: string;
}): Sale {
  return {
    id: row.id,
    product_id: row.product_id,
    quantity: row.quantity,
    unit_price: Number(row.unit_price),
    total_amount: Number(row.total_amount),
    created_at: row.created_at,
    ...(row.product_name !== undefined ? { product_name: row.product_name } : {}),
  };
}

export const Route = createFileRoute("/api/public/sales")({
  server: {
    handlers: {
      GET: async () => {
        const db = getShopDb();
        const { data, error } = await db
          .from("sales")
          .select("id, product_id, quantity, unit_price, total_amount, created_at, products(name)")
          .order("created_at", { ascending: false })
          .limit(1000);
        if (error) {
          return Response.json({ error: "Could not load sales" }, { status: 500 });
        }
        return Response.json(
          (data ?? []).map((row) => {
            const embedded = row.products as { name: string } | { name: string }[] | null;
            const name = Array.isArray(embedded) ? embedded[0]?.name : embedded?.name;
            return saleRow({ ...row, ...(name ? { product_name: name } : {}) });
          }),
        );
      },

      POST: async ({ request }) => {
        const parsed = recordSaleSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 },
          );
        }

        const db = getShopDb();
        // The database function records the sale and deducts stock in one
        // transaction — the API never deducts stock separately.
        const { data, error } = await db.rpc("record_sale", {
          p_product_id: parsed.data.product_id,
          p_quantity: parsed.data.quantity,
        });
        if (error) {
          const message = error.message;
          const status = message.includes("Insufficient stock")
            ? 409
            : message.includes("Product not found")
              ? 404
              : 500;
          return Response.json({ error: message }, { status });
        }
        return Response.json(saleRow(data as Parameters<typeof saleRow>[0]), { status: 201 });
      },
    },
  },
});
