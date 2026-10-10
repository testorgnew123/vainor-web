-- Fix: Orders table public exposure issue
-- Drop the problematic policy that allows NULL user_id access
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create a secure policy for authenticated users to view their own orders only
-- This removes the dangerous OR (user_id IS NULL) condition
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);