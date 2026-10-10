-- ADMIN PORTAL DATABASE SCHEMA UPDATES
-- Run this SQL in your Neon database to add admin functionality

-- ============================================
-- 1. ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Insert default admin user (password: Admin@123)
-- The password hash below is the bcrypt hash for 'Admin@123'
INSERT INTO public.admin_users (email, password_hash, name, role) VALUES
  ('admin@atelier.com', '$2a$10$rQnM1vJ8xUJwJHBDAJDiseOk3SxJP8zDpVxJmOdUVWJBMOqWqxLa6', 'Admin User', 'super_admin')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$rQnM1vJ8xUJwJHBDAJDiseOk3SxJP8zDpVxJmOdUVWJBMOqWqxLa6';

-- ============================================
-- 2. BLOG POSTS TABLE (SEO Optimized)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- SEO Fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT,
  og_image TEXT,
  
  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  author_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  
  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- ============================================
-- 3. BLOG CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Fashion Tips', 'fashion-tips', 'Style guides and fashion advice'),
  ('Trends', 'trends', 'Latest fashion trends and updates'),
  ('Behind the Scenes', 'behind-the-scenes', 'Stories from our workshop'),
  ('Sustainability', 'sustainability', 'Our eco-friendly initiatives'),
  ('Style Guide', 'style-guide', 'How to wear our collections')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. PRODUCT VIEWS TABLE (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON public.product_views(viewed_at DESC);

-- ============================================
-- 5. INVENTORY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'sale', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  notes TEXT,
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON public.inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_created_at ON public.inventory_log(created_at DESC);

-- ============================================
-- 6. UPDATE TRIGGERS (if not exists)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_users_updated_at') THEN
    CREATE TRIGGER update_admin_users_updated_at 
      BEFORE UPDATE ON public.admin_users 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at') THEN
    CREATE TRIGGER update_blog_posts_updated_at 
      BEFORE UPDATE ON public.blog_posts 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 7. DAILY ANALYTICS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.daily_order_stats AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM public.orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- ============================================
-- 8. PRODUCT SALES VIEW
-- ============================================
CREATE OR REPLACE VIEW public.product_sales_stats AS
SELECT 
  oi.product_id,
  oi.product_name,
  COUNT(*) as times_ordered,
  SUM(oi.quantity) as total_units_sold,
  SUM(oi.price * oi.quantity) as total_revenue
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_revenue DESC;
