-- Phase 1: Database changes for Guest Order Linking + User Management

-- 1. Add email column to orders table for guest order linking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);

-- Backfill email from shipping_address JSONB for existing orders
UPDATE public.orders
SET email = shipping_address->>'email'
WHERE email IS NULL AND shipping_address->>'email' IS NOT NULL;

-- 2. Add is_blocked column to profiles table for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- 3. Create function to claim guest orders when a user logs in or signs up
CREATE OR REPLACE FUNCTION public.claim_guest_orders(user_email TEXT, for_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_count INTEGER;
BEGIN
  UPDATE orders
  SET user_id = for_user_id
  WHERE email = user_email
    AND user_id IS NULL;

  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count;
END;
$$;
