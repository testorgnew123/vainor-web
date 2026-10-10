# Troubleshooting Guide

## Coupon System Issues

### Problem: "VIP15" or other coupons showing as invalid

**Root Cause:** The coupon data hasn't been inserted into the Supabase database yet.

### ✅ Quick Fix (5 minutes)

1. **Go to your Supabase Dashboard**
   - Open your project at https://app.supabase.com

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Copy the SQL script**
   - Open the file `insert-coupons.sql` in this project
   - Copy all the contents

4. **Run the script**
   - Paste into the SQL Editor
   - Click "RUN" button
   - You should see 5 rows inserted

5. **Verify it worked**
   - Go to "Table Editor" > "coupons"
   - You should see 5 coupons (WELCOME10, SAVE20, FREESHIP, FASHION25, VIP15)

6. **Test in your app**
   - Add items to cart (total > $150 for VIP15)
   - Enter coupon: **VIP15**
   - Click Apply
   - Should see discount applied!

### Test All Available Coupons

| Code | Description | Type | Value | Min Order |
|------|-------------|------|-------|-----------|
| **WELCOME10** | 10% off first order | Percentage | 10% | $0 |
| **SAVE20** | 20% off orders over $200 | Percentage | 20% | $200 |
| **FREESHIP** | Free shipping | Fixed | $50 | $0 |
| **FASHION25** | $25 off your order | Fixed | $25 | $100 |
| **VIP15** | VIP Exclusive 15% off | Percentage | 15% | $150 |

### Common Errors & Solutions

#### Error: "relation 'public.coupons' does not exist"

**Cause:** The coupons table hasn't been created.

**Solution:**
```bash
# In WSL Ubuntu-24
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

# Run all migrations
npx supabase db push

# Or manually create table via SQL Editor
# See supabase/migrations/20260131185708_*.sql
```

#### Error: "Database error: [some error message]"

**Cause:** Supabase connection issue or RLS policy problem.

**Solutions:**
1. Check `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

2. Verify RLS policies exist:
   ```sql
   -- Run in SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'coupons';
   ```

   Should show:
   - "Anyone can view active coupons" (SELECT)
   - "Admins can manage coupons" (ALL)

#### Error: "Coupon inactive" or "Coupon expired"

**Cause:** Coupon has `is_active = false` or `expires_at` is in the past.

**Solution:**
```sql
-- Update coupon to be active and extend expiration
UPDATE public.coupons 
SET 
  is_active = true,
  expires_at = CURRENT_TIMESTAMP + INTERVAL '6 months'
WHERE code = 'VIP15';
```

#### Error: "Minimum order not met"

**Cause:** Cart total is less than coupon's `min_order_amount`.

**Solution:** Add more items to reach the minimum:
- VIP15 requires $150 minimum
- SAVE20 requires $200 minimum
- FASHION25 requires $100 minimum

### Verification Checklist

- [ ] Supabase project is set up
- [ ] `.env` file has correct credentials
- [ ] Migrations have been run (coupons table exists)
- [ ] Sample coupons have been inserted
- [ ] RLS policies are enabled for coupons table
- [ ] Cart has items totaling above minimum order amount
- [ ] Coupon code is spelled correctly (case-insensitive)

### Test Coupon System

Run the test script to diagnose issues:

```bash
# In WSL Ubuntu-24
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main
npm run test:coupons
```

This will check:
- ✅ Database connection
- ✅ Coupons table accessibility
- ✅ VIP15 coupon exists
- ✅ All active coupons list

### Still Having Issues?

1. **Check browser console** (F12 > Console tab)
   - Look for any red error messages
   - Common issues show up here

2. **Check Network tab** (F12 > Network tab)
   - Filter by "supabase"
   - Check the response from coupon queries
   - Status should be 200 OK

3. **Verify Supabase Dashboard**
   - Go to Table Editor > coupons
   - Make sure rows exist
   - Check `is_active` column is true

4. **Test with console**
   ```javascript
   // Open browser console on your site
   // Test Supabase connection
   const { data, error } = await window.supabase
     .from('coupons')
     .select('*')
     .eq('code', 'VIP15')
     .single();
   
   console.log('Coupon:', data);
   console.log('Error:', error);
   ```

### Advanced: Manual Database Setup

If all else fails, manually create and populate:

```sql
-- 1. Create table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Anyone can view active coupons" 
  ON public.coupons FOR SELECT 
  USING (is_active = true);

-- 4. Insert sample data
-- (Use insert-coupons.sql)
```

---

**Need more help?** Check the implementation in `src/pages/Cart.tsx` lines 40-140 for the coupon validation logic.
