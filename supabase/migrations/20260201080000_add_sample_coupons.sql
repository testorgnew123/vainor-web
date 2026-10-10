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
