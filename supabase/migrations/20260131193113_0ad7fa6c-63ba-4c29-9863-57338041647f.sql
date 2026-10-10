-- Make user_id nullable in orders table to support guest checkout
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Drop and recreate RLS policies for guest checkout support
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = user_id OR user_id IS NULL
);