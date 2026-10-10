-- Drop existing table if schema is wrong
DROP TABLE IF EXISTS public.product_views CASCADE;

-- Create product_views table for tracking product page views
CREATE TABLE public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON public.product_views(viewed_at DESC);

-- Add comment
COMMENT ON TABLE public.product_views IS 'Tracks product page views for analytics';
