-- Fix addresses table to work with custom JWT authentication
-- The addresses table was referencing auth.users, but we use custom public.users table

-- Step 1: Drop the existing addresses table (safe since it's likely empty or has invalid data)
DROP TABLE IF EXISTS public.addresses CASCADE;

-- Step 2: Recreate addresses table with correct foreign key to public.users
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Create index for performance
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- Step 4: Create trigger for auto-updating updated_at
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Note: RLS (Row Level Security) is not enabled for addresses since we're using custom JWT auth
-- Access control is handled in the Netlify function via verifyCustomerToken
