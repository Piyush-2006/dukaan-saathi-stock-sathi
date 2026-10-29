-- DukaanSaathi AI core schema
CREATE TABLE public.products (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  selling_price numeric(12,2) NOT NULL CHECK (selling_price > 0),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sales (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_created_at ON public.sales (created_at DESC);
CREATE INDEX idx_sales_product_id ON public.sales (product_id);

GRANT SELECT, INSERT, UPDATE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT ON public.sales TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.sales TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop inventory is publicly readable" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shop owners can add products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Shop owners can update stock" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Sales are publicly readable" ON public.sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Sales can be recorded" ON public.sales FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Transactional sale recording + stock deduction owned by the database.
CREATE OR REPLACE FUNCTION public.record_sale(p_product_id bigint, p_quantity integer)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_price numeric(12,2);
  v_qty integer;
  v_sale public.sales%ROWTYPE;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;
  SELECT selling_price, quantity INTO v_price, v_qty
  FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  IF v_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: only % available, % requested', v_qty, p_quantity;
  END IF;
  INSERT INTO public.sales (product_id, quantity, unit_price, total_amount)
  VALUES (p_product_id, p_quantity, v_price, round(v_price * p_quantity, 2))
  RETURNING * INTO v_sale;
  UPDATE public.products
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE id = p_product_id;
  RETURN to_json(v_sale);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_sale(bigint, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.record_sale(bigint, integer) TO anon, authenticated;

-- Demo seed: kirana inventory with a small sales history so dashboards and
-- reports show real recorded data on first open.
INSERT INTO public.products (name, selling_price, quantity, low_stock_threshold) VALUES
  ('Aashirvaad Atta 5kg', 245.00, 18, 5),
  ('India Gate Basmati Rice 5kg', 520.00, 9, 4),
  ('Fortune Sunflower Oil 1L', 138.00, 24, 6),
  ('Amul Taaza Milk 500ml', 27.00, 40, 12),
  ('Parle-G Biscuits 800g', 85.00, 6, 5),
  ('Tata Salt 1kg', 24.00, 30, 8),
  ('Red Label Tea 500g', 265.00, 7, 3),
  ('Colgate Strong Teeth 200g', 99.00, 0, 6),
  ('Maggi Noodles 12-pack', 168.00, 15, 5),
  ('Surf Excel Easy Wash 1kg', 112.00, 11, 4),
  ('Dove Shampoo 340ml', 349.00, 6, 3),
  ('Haldiram Aloo Bhujia 400g', 92.00, 13, 5);

INSERT INTO public.sales (product_id, quantity, unit_price, total_amount, created_at)
SELECT p.id, s.qty, p.selling_price, p.selling_price * s.qty,
       now() - interval '1 day' * s.days_ago - interval '4 hours' * (s.days_ago = 0)::int
       + interval '25 minutes' * s.ord
FROM (VALUES
  ('Aashirvaad Atta 5kg', 2, 3, 1),
  ('Amul Taaza Milk 500ml', 6, 3, 2),
  ('Fortune Sunflower Oil 1L', 1, 3, 3),
  ('Parle-G Biscuits 800g', 3, 2, 4),
  ('Red Label Tea 500g', 1, 2, 5),
  ('Maggi Noodles 12-pack', 2, 2, 6),
  ('Tata Salt 1kg', 4, 1, 7),
  ('Surf Excel Easy Wash 1kg', 2, 1, 8),
  ('India Gate Basmati Rice 5kg', 1, 0, 9),
  ('Amul Taaza Milk 500ml', 4, 0, 10),
  ('Haldiram Aloo Bhujia 400g', 2, 0, 11),
  ('Aashirvaad Atta 5kg', 1, 0, 12)
) AS s(pname, qty, days_ago, ord)
JOIN public.products p ON p.name = s.pname;

UPDATE public.products SET quantity = quantity - 2 WHERE name = 'Aashirvaad Atta 5kg';
UPDATE public.products SET quantity = quantity - 10 WHERE name = 'Amul Taaza Milk 500ml';
UPDATE public.products SET quantity = quantity - 1 WHERE name = 'Fortune Sunflower Oil 1L';
UPDATE public.products SET quantity = quantity - 3 WHERE name = 'Parle-G Biscuits 800g';
UPDATE public.products SET quantity = quantity - 1 WHERE name = 'Red Label Tea 500g';
UPDATE public.products SET quantity = quantity - 2 WHERE name = 'Maggi Noodles 12-pack';
UPDATE public.products SET quantity = quantity - 4 WHERE name = 'Tata Salt 1kg';
UPDATE public.products SET quantity = quantity - 2 WHERE name = 'Surf Excel Easy Wash 1kg';
UPDATE public.products SET quantity = quantity - 1 WHERE name = 'India Gate Basmati Rice 5kg';
UPDATE public.products SET quantity = quantity - 2 WHERE name = 'Haldiram Aloo Bhujia 400g';
UPDATE public.products SET quantity = quantity - 1 WHERE name = 'Aashirvaad Atta 5kg';
