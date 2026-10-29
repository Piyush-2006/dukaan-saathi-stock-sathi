import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getShopDb } from "@/lib/server/shop-db";

const stockUpdateSchema = z
  .object({
    quantity: z.coerce
      .number({ message: "Quantity must be a whole number" })
      .int("Quantity must be a whole number")
      .min(0, "Quantity cannot be negative")
      .optional(),
    quantity_change: z.coerce
      .number({ message: "Stock change must be a whole number" })
      .int("Stock change must be a whole number")
      .optional(),
  })
  .refine((d) => d.quantity !== undefined || d.quantity_change !== undefined, {
    message: "Provide a new quantity or a stock change",
  });

export const Route = createFileRoute("/api/public/products/$id/stock")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const productId = Number.parseInt(params.id, 10);
        if (Number.isNaN(productId)) {
          return Response.json({ error: "Product not found" }, { status: 404 });
        }

        const parsed = stockUpdateSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 },
          );
        }

        const db = getShopDb();

        let newQuantity = parsed.data.quantity;
        if (newQuantity === undefined) {
          // Relative adjust: read the current level first, clamp at zero.
          const { data: current, error: readError } = await db
            .from("products")
            .select("quantity")
            .eq("id", productId)
            .single();
          if (readError || !current) {
            return Response.json({ error: "Product not found" }, { status: 404 });
          }
          newQuantity = Math.max(0, current.quantity + (parsed.data.quantity_change ?? 0));
        }

        const { data, error } = await db
          .from("products")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", productId)
          .select()
          .single();
        if (error || !data) {
          return Response.json({ error: "Product not found" }, { status: 404 });
        }
        return Response.json(data);
      },
    },
  },
});
