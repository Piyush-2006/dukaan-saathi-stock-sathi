import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getShopDb } from "@/lib/server/shop-db";

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120, "Product name is too long"),
  selling_price: z.coerce
    .number({ message: "Selling price must be a number" })
    .positive("Selling price must be greater than zero")
    .max(100_000_000, "Selling price is unreasonably large"),
  quantity: z.coerce
    .number({ message: "Quantity must be a whole number" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  low_stock_threshold: z.coerce
    .number()
    .int()
    .min(0, "Low-stock threshold cannot be negative")
    .optional(),
});

function validationResponse(error: z.ZodError) {
  return Response.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
}

export const Route = createFileRoute("/api/public/products")({
  server: {
    handlers: {
      GET: async () => {
        const db = getShopDb();
        const { data, error } = await db.from("products").select("*").order("name");
        if (error) {
          return Response.json({ error: "Could not load products" }, { status: 500 });
        }
        return Response.json(data);
      },

      POST: async ({ request }) => {
        const parsed = createProductSchema.safeParse(await request.json());
        if (!parsed.success) return validationResponse(parsed.error);

        const db = getShopDb();
        const { data, error } = await db
          .from("products")
          .insert({
            name: parsed.data.name,
            selling_price: parsed.data.selling_price,
            quantity: parsed.data.quantity,
            ...(parsed.data.low_stock_threshold !== undefined
              ? { low_stock_threshold: parsed.data.low_stock_threshold }
              : {}),
          })
          .select()
          .single();
        if (error) {
          return Response.json({ error: "Could not save the product" }, { status: 500 });
        }
        return Response.json(data, { status: 201 });
      },
    },
  },
});
