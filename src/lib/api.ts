import type { Health, NewProduct, Product, Sale } from "./types";

/**
 * API service layer for DukaanSaathi AI.
 *
 * All requests go through the same-origin backend routes, which in turn talk to
 * the database. No database keys or clients ever live in frontend code.
 * Set VITE_API_URL to point the layer at a different backend; by default the
 * app talks to its own backend.
 */
const API_BASE = import.meta.env["VITE_API_URL"] ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "Could not reach the shop server. Check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body?.error === "string" && body.error.length > 0) message = body.error;
    } catch {
      // keep the default message when the body is not JSON
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/api/public/health"),

  listProducts: () => request<Product[]>("/api/public/products"),

  createProduct: (payload: NewProduct) =>
    request<Product>("/api/public/products", { method: "POST", body: JSON.stringify(payload) }),

  updateStock: (
    productId: number,
    payload: { quantity?: number; quantity_change?: number },
  ) =>
    request<Product>(`/api/public/products/${productId}/stock`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listSales: () => request<Sale[]>("/api/public/sales"),

  recordSale: (payload: { product_id: number; quantity: number }) =>
    request<Sale>("/api/public/sales", { method: "POST", body: JSON.stringify(payload) }),
};
