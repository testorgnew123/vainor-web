-- Quick Fix: Insert Sample Coupons
-- Copy and paste this entire script into Supabase SQL Editor and click RUN

-- This will insert 5 test coupons into your database
-- If coupons already exist, they will be skipped (no errors)

INSERT INTO public.coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_order_amount, 
  max_discount, 
  usage_limit, 
  is_active, 
  starts_at, 
  expires_at
)
VALUES
  -- 10% off welcome coupon
  (
    'WELCOME10',
    'Welcome! Get 10% off your first order',
    'percentage',
    10.00,
    0.00,
    50.00,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year'
  ),
  -- 20% off for orders over $200
  (
    'SAVE20',
    'Save 20% on orders over $200',
    'percentage',
    20.00,
    200.00,
    100.00,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '6 months'
  ),
  -- Free shipping (effectively $50 off)
  (
    'FREESHIP',
    'Free shipping on any order',
    'fixed',
    50.00,
    0.00,
    NULL,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '3 months'
  ),
  -- $25 off orders over $100
  (
    'FASHION25',
    'Get $25 off your order',
    'fixed',
    25.00,
    100.00,
    NULL,
    500,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month'
  ),
  -- VIP 15% off (the one you're testing!)
  (
    'VIP15',
    'VIP Exclusive: 15% off everything',
    'percentage',
    15.00,
    150.00,
    NULL,
    100,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '2 months'
  )
ON CONFLICT (code) DO NOTHING;

-- Verify coupons were inserted
SELECT 
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  is_active,
  expires_at
FROM public.coupons
ORDER BY code;
