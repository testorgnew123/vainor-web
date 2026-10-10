-- Add SKU column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Create unique index on SKU (allowing NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique identifier for inventory management';
