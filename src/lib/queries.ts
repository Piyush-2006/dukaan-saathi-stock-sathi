import { queryOptions } from "@tanstack/react-query";

import { api } from "./api";

export const healthQuery = () =>
  queryOptions({
    queryKey: ["health"],
    queryFn: () => api.health(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => api.listProducts(),
    staleTime: 10_000,
  });

export const salesQuery = () =>
  queryOptions({
    queryKey: ["sales"],
    queryFn: () => api.listSales(),
    staleTime: 10_000,
  });
