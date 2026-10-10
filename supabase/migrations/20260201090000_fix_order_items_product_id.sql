-- Fix order_items.product_id to be TEXT instead of UUID
-- Products are stored in frontend code, not in the database

-- Drop the foreign key constraint first
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE public.order_items ALTER COLUMN product_id TYPE TEXT USING product_id::TEXT;
