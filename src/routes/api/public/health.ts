import { createFileRoute } from "@tanstack/react-router";

import { getShopDb } from "@/lib/server/shop-db";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const version = "1.0.0";
        try {
          const db = getShopDb();
          const { count, error } = await db
            .from("products")
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return Response.json({
            status: "ok",
            database: true,
            product_count: count ?? null,
            server_time: new Date().toISOString(),
            version,
          });
        } catch {
          return Response.json({
            status: "degraded",
            database: false,
            product_count: null,
            server_time: new Date().toISOString(),
            version,
          });
        }
      },
    },
  },
});
