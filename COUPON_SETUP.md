# Coupon System Setup Guide

## Issue: "VIP15" or other coupon codes not working

This happens because the sample coupon data hasn't been inserted into the database yet.

## Solution Options:

### Option 1: Run SQL Directly in Supabase SQL Editor (⭐ Recommended - Easiest)

1. Go to your Supabase dashboard at https://app.supabase.com
2. Navigate to **SQL Editor**
3. Create a new query and paste the following:

```sql
-- Add sample coupons for testing
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active, starts_at, expires_at)
VALUES
  (
    'WELCOME10',
    'Welcome! Get 10% off your first order',
    'percentage',
    10,
    0,
    50,
    NULL,
    true,
    now(),
    now() + interval '1 year'
  ),
  (
    'SAVE20',
    'Save 20% on orders over $200',
    'percentage',
    20,
    200,
    100,
    NULL,
    true,
    now(),
    now() + interval '6 months'
  ),
  (
    'FREESHIP',
    'Free shipping on any order',
    'fixed',
    50,
    0,
    NULL,
    NULL,
    true,
    now(),
    now() + interval '3 months'
  ),
  (
    'FASHION25',
    'Get $25 off your order',
    'fixed',
    25,
    100,
    NULL,
    500,
    true,
    now(),
    now() + interval '1 month'
  ),
  (
    'VIP15',
    'VIP Exclusive: 15% off everything',
    'percentage',
    15,
    150,
    NULL,
    100,
    true,
    now(),
    now() + interval '2 months'
  )
ON CONFLICT (code) DO NOTHING;
```

4. Click **RUN** to execute
5. Done! ✅

### Option 2: Use Supabase CLI (Requires Setup)

If you want to use the CLI, you need to link your project first:

```bash
# In WSL Ubuntu-24, navigate to project directory
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

# First time: Link your local project to remote Supabase project
supabase link --project-ref your-project-ref
# Get your project-ref from: https://app.supabase.com/project/_/settings/general

# Then run migrations
supabase db push

# Or use npx if you don't have CLI installed globally
npx supabase link --project-ref your-project-ref
npx supabase db push
```

**Note:** If you get "Cannot find project ref" error, you need to link first!

### Option 3: Manually Insert Coupons via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** > **coupons**
3. Click **Insert Row** and add these coupons:

#### Coupon 1: WELCOME10
- **code**: WELCOME10
- **description**: Welcome! Get 10% off your first order
- **discount_type**: percentage
- **discount_value**: 10
- **min_order_amount**: 0
- **max_discount**: 50
- **is_active**: true
- **starts_at**: now()
- **expires_at**: (1 year from now)

#### Coupon 2: SAVE20
- **code**: SAVE20
- **description**: Save 20% on orders over $200
- **discount_type**: percentage
- **discount_value**: 20
- **min_order_amount**: 200
- **max_discount**: 100
- **is_active**: true
- **starts_at**: now()
- **expires_at**: (6 months from now)

#### Coupon 3: FREESHIP
- **code**: FREESHIP
- **description**: Free shipping on any order
- **discount_type**: fixed
- **discount_value**: 50
- **min_order_amount**: 0
- **is_active**: true
- **starts_at**: now()
- **expires_at**: (3 months from now)

#### Coupon 4: FASHION25
- **code**: FASHION25
- **description**: Get $25 off your order
- **discount_type**: fixed
- **discount_value**: 25
- **min_order_amount**: 100
- **usage_limit**: 500
- **is_active**: true
- **starts_at**: now()
- **expires_at**: (1 month from now)

#### Coupon 5: VIP15
- **code**: VIP15
- **description**: VIP Exclusive: 15% off everything
- **discount_type**: percentage
- **discount_value**: 15
- **min_order_amount**: 150
- **usage_limit**: 100
- **is_active**: true
- **starts_at**: now()
- **expires_at**: (2 months from now)

## Verify Coupons Are Working

1. Go to your cart page with items
2. Enter coupon code: **VIP15** (or any other code)
3. Click **Apply**
4. You should see the discount applied

## Testing Notes

- Coupon codes are **case-insensitive** (VIP15, vip15, Vip15 all work)
- Make sure your cart total meets the minimum order amount
- Check that the coupon hasn't expired
- Verify RLS policies allow reading active coupons

## Troubleshooting

### Error: "Cannot find project ref. Have you run supabase link?"
- You need to link your local project to Supabase first
- **Quick Fix:** Use Option 1 (SQL Editor) instead - no linking required!
- Or run: `supabase link --project-ref YOUR_PROJECT_REF`
- Get your project ref from: Supabase Dashboard > Settings > General

### Error: "relation 'public.coupons' does not exist"
- The coupons table hasn't been created
- Run migrations: `supabase db push` (after linking)
- Or create table manually via SQL Editor

### Error: "new row violates row-level security policy"
- RLS is enabled but you're trying to insert without proper permissions
- Use Option 1 (SQL Editor) which runs as service role

### Coupon code shows as invalid
- Check if the coupon exists in the database
- Verify `is_active = true`
- Check expiration dates
- Verify minimum order amount is met
