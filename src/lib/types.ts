export type StockStatus = "ok" | "low" | "out";

export type Product = {
  id: number;
  name: string;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type NewProduct = {
  name: string;
  selling_price: number;
  quantity: number;
  low_stock_threshold?: number;
};

export type Sale = {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
};

export type Health = {
  status: "ok" | "degraded";
  database: boolean;
  product_count: number | null;
  server_time: string;
  version: string;
};
