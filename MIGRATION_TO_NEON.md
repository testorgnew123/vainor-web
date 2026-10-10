# Migration Guide: Supabase → Neon + Netlify Functions

This guide will walk you through migrating your Atelier e-commerce project from Supabase to Neon PostgreSQL with Netlify Functions.

**Estimated Time:** 1-2 days
**Difficulty:** Medium
**Cost:** $0/month

---

## 📋 Pre-Migration Checklist

- [ ] Sign up for Neon account (https://neon.tech)
- [ ] Sign up for Auth0 account (https://auth0.com) or Clerk (https://clerk.com)
- [ ] Backup current Supabase data
- [ ] Create Netlify account (if not already)
- [ ] Have GitHub repository ready

---

## Phase 1: Setup Neon Database (30 minutes)

### Step 1.1: Create Neon Project

1. Go to https://neon.tech and sign up
2. Click "Create Project"
3. Choose:
   - **Name:** atelier-production
   - **Region:** Choose closest to your users (e.g., US East for NA)
   - **PostgreSQL Version:** 16 (latest)
4. Click "Create Project"

### Step 1.2: Get Connection String

After project creation, you'll see:
```
Connection String: postgres://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
psql 'postgresql://neondb_owner:npg_4K2aeYMlfivV@ep-steep-hall-a1w0lt2u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
**Save this** - you'll need it multiple times.

### Step 1.3: Create Database Structure

In WSL Ubuntu-24:

```bash
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

# Install PostgreSQL client if not installed
sudo apt-get update
sudo apt-get install -y postgresql-client

# Combine all migration files
cat supabase/migrations/*.sql > neon_schema.sql

# Connect to Neon and create schema
psql "postgres://user:password@ep-xxx.neon.tech/neondb?sslmode=require" < neon_schema.sql
```

### Step 1.4: Verify Schema Creation

```bash
# Connect to Neon
psql "postgres://your-connection-string"

# Check tables
\dt

# Should see: products, orders, coupons, users, etc.
# Type \q to exit
```

---

## Phase 2: Migrate Data (30 minutes)

### Step 2.1: Export from Supabase

**Option A: If you have Supabase access**

```bash
# Export data only (no schema)
pg_dump -h dnxntcmlwizbqvhcanvy.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-privileges \
  -f supabase_data.sql
```

**Option B: Using managed Supabase** (recommended)

If you're using a managed Supabase instance, you'll need to insert sample data manually:

```bash
# Use the coupon migration file you already have
psql "postgres://your-neon-connection" < supabase/migrations/20260201080000_add_sample_coupons.sql
```

For products, we'll keep the local data in `src/data/products.ts` for now.

### Step 2.2: Verify Data

```bash
psql "postgres://your-neon-connection"

# Check coupons
SELECT code, discount_type, discount_value FROM coupons;

# Should see: WELCOME10, SAVE20, FREESHIP, FASHION25, VIP15
```

---

## Phase 3: Setup Authentication (1 hour)

### Option A: Auth0 (Recommended)

#### Step 3.1: Create Auth0 Application

1. Go to https://auth0.com/signup
2. Create free account
3. Create New Application
   - **Name:** Atelier E-commerce
   - **Type:** Single Page Application
   - Click "Create"

#### Step 3.2: Configure Auth0

1. In application settings:
   - **Allowed Callback URLs:** 
     ```
     http://localhost:5173/callback,
     https://your-site.netlify.app/callback
     ```
   - **Allowed Logout URLs:**
     ```
     http://localhost:5173,
     https://your-site.netlify.app
     ```
   - **Allowed Web Origins:**
     ```
     http://localhost:5173,
     https://your-site.netlify.app
     ```
2. Save Changes
3. Copy **Domain** and **Client ID**

#### Step 3.3: Install Auth0 SDK

```bash
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

npm install @auth0/auth0-react
```

---

## Phase 4: Create Netlify Functions (2 hours)

### Step 4.1: Install Dependencies

```bash
npm install pg dotenv
npm install -D @netlify/functions @types/pg
```

### Step 4.2: Create Netlify Configuration

```bash
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[dev]
  command = "npm run dev"
  port = 5173
  targetPort = 5173

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
EOF
```

### Step 4.3: Create Database Utility

```bash
mkdir -p netlify/functions/utils
```

Create `netlify/functions/utils/db.ts`:

```typescript
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

### Step 4.4: Create Functions to Replace Supabase Edge Functions

#### Function 1: Get Coupons (`netlify/functions/get-coupon.ts`)

```typescript
import { Handler } from '@netlify/functions';
import { query } from './utils/db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coupon code is required' }),
      };
    }

    const result = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Coupon not found' }),
      };
    }

    const coupon = result.rows[0];

    // Validate expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coupon expired' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: coupon }),
    };
  } catch (error) {
    console.error('Get coupon error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

#### Function 2: Create Razorpay Order (`netlify/functions/create-razorpay-order.ts`)

```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { amount, currency = 'INR', receipt, notes } = JSON.parse(event.body || '{}');

    // Validation
    if (!amount || amount < 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid amount' }),
      };
    }

    // Call Razorpay API
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
      }),
    });

    const order = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: razorpayKey,
      }),
    };
  } catch (error) {
    console.error('Create order error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create order' }),
    };
  }
};
```

#### Function 3: Verify Payment & Create Order (`netlify/functions/verify-payment.ts`)

```typescript
import { Handler } from '@netlify/functions';
import { query } from './utils/db';
import * as crypto from 'crypto';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_data,
    } = JSON.parse(event.body || '{}');

    // Verify signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Generate order number
    const orderNumber = `ATL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create order in database
    const orderResult = await query(
      `INSERT INTO orders (
        order_number, user_id, status, subtotal, tax, shipping_cost, total,
        shipping_address, billing_address, payment_method, payment_status, payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        orderNumber,
        order_data.user_id || null,
        'pending',
        order_data.subtotal,
        order_data.tax,
        order_data.shipping_cost,
        order_data.total,
        JSON.stringify(order_data.shipping_address),
        JSON.stringify(order_data.billing_address),
        'razorpay',
        'paid',
        razorpay_payment_id,
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of order_data.items) {
      await query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_image, 
          quantity, size, color, price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.product_image,
          item.quantity,
          item.size,
          item.color,
          item.price,
        ]
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order_number: orderNumber,
      }),
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to verify payment' }),
    };
  }
};
```

#### Function 4: Get Orders (`netlify/functions/get-orders.ts`)

```typescript
import { Handler } from '@netlify/functions';
import { query } from './utils/db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get user ID from Auth0 token (you'll need to decode JWT)
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // For now, get from request body
    const { user_id } = JSON.parse(event.body || '{}');

    const result = await query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'product_name', oi.product_name,
          'product_image', oi.product_image,
          'quantity', oi.quantity,
          'size', oi.size,
          'color', oi.color,
          'price', oi.price
        )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: result.rows }),
    };
  } catch (error) {
    console.error('Get orders error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get orders' }),
    };
  }
};
```

---

## Phase 5: Update Frontend Code (3 hours)

### Step 5.1: Update Environment Variables

Update `.env`:

```env
# Remove Supabase variables
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...

# Add new variables
VITE_AUTH0_DOMAIN=your-app.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Razorpay (keep existing or add)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-secret
```

### Step 5.2: Replace Supabase Client

Create `src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

export async function apiCall(endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}
```

### Step 5.3: Replace Supabase Auth with Auth0

Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback'
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Auth0Provider>
  </React.StrictMode>
);
```

### Step 5.4: Update useAuth Hook

Replace `src/hooks/useAuth.ts`:

```typescript
import { useAuth0 } from '@auth0/auth0-react';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  return {
    user: isAuthenticated ? {
      id: user?.sub,
      email: user?.email,
      user_metadata: {
        first_name: user?.given_name,
        last_name: user?.family_name,
      }
    } : null,
    isLoading,
    signIn: async (email: string, password: string) => {
      await loginWithRedirect({
        authorizationParams: {
          login_hint: email,
        }
      });
    },
    signUp: async (email: string, password: string, metadata: any) => {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          login_hint: email,
        }
      });
    },
    signOut: () => {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    },
    isAdmin: false, // Implement role checking via Auth0 if needed
  };
}
```

### Step 5.5: Update Cart Component to Use New API

Update `src/pages/Cart.tsx` coupon section:

```typescript
// Replace Supabase call
const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    toast({
      title: 'Please enter a coupon code',
      variant: 'destructive',
    });
    return;
  }

  setIsApplyingCoupon(true);

  try {
    // Call Netlify function instead of Supabase
    const response = await apiCall('get-coupon', { code: couponCode });
    const coupon = response.data;

    // Validation logic (same as before)
    if (!coupon.is_active) {
      toast({
        title: 'Coupon inactive',
        description: 'This coupon is no longer active.',
        variant: 'destructive',
      });
      return;
    }

    // ... rest of validation ...

    // Apply coupon
    setAppliedCoupon({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: parseFloat(coupon.discount_value),
      maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : undefined,
    });

    toast({
      title: 'Coupon applied!',
      description: coupon.description || 'Your discount has been applied.',
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    toast({
      title: 'Invalid coupon code',
      description: error.message,
      variant: 'destructive',
    });
  } finally {
    setIsApplyingCoupon(false);
  }
};
```

### Step 5.6: Update Checkout to Use New Payment Flow

Update `src/pages/Checkout.tsx`:

```typescript
import { apiCall } from '@/lib/api';

// In handleSubmit function
const handleSubmit = async (data: CheckoutFormData) => {
  try {
    setIsProcessing(true);

    // Create Razorpay order via Netlify function
    const orderResponse = await apiCall('create-razorpay-order', {
      amount: Math.round(finalTotal * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Initiate payment with Razorpay
    await initiatePayment({
      order_id: orderResponse.order_id,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: 'Atelier',
      description: 'Fashion Purchase',
      prefill: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        contact: data.phone,
      },
      onSuccess: async (response) => {
        // Verify payment via Netlify function
        const verifyResponse = await apiCall('verify-payment', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_data: {
            user_id: user?.id,
            items: items.map(item => ({
              product_id: item.product.id,
              product_name: item.product.name,
              product_image: item.product.images[0],
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.product.price,
            })),
            subtotal: totalPrice,
            tax: tax,
            shipping_cost: shippingCost,
            total: finalTotal,
            shipping_address: data,
            billing_address: data,
          },
        });

        clearCart();
        navigate(`/order-success?order=${verifyResponse.order_number}`);
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    toast({
      title: 'Checkout failed',
      description: error.message,
      variant: 'destructive',
    });
  } finally {
    setIsProcessing(false);
  }
};
```

---

## Phase 6: Testing (1 hour)

### Step 6.1: Test Locally

```bash
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set DATABASE_URL "postgres://..."
netlify env:set RAZORPAY_KEY_ID "rzp_test_..."
netlify env:set RAZORPAY_KEY_SECRET "secret..."

# Start dev server with functions
netlify dev
```

### Step 6.2: Test Features

1. ✅ **Authentication**
   - Sign up
   - Sign in
   - Sign out

2. ✅ **Products**
   - Browse products
   - View product details
   - Add to cart

3. ✅ **Cart**
   - Update quantities
   - Apply coupon code (try: VIP15)
   - Remove items

4. ✅ **Checkout**
   - Fill form
   - Submit payment
   - Verify order created

5. ✅ **Orders**
   - View order history
   - View order details

---

## Phase 7: Deploy to Netlify (30 minutes)

### Step 7.1: Push to GitHub

```bash
cd /mnt/c/Users/honey/Downloads/kylecheck1-main/kylecheck1-main

git add .
git commit -m "Migrate from Supabase to Neon + Netlify Functions"
git push origin main
```

### Step 7.2: Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub
4. Select your repository
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

### Step 7.3: Set Environment Variables in Netlify

In Netlify Dashboard → Site settings → Environment variables:

```
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Step 7.4: Deploy

Click "Deploy site" - Netlify will automatically build and deploy!

---

## Phase 8: Post-Deployment Verification

### Step 8.1: Update Auth0 URLs

In Auth0 dashboard, add your Netlify URL:
```
https://your-site.netlify.app/callback
https://your-site.netlify.app
```

### Step 8.2: Test Production Site

1. Visit your Netlify URL
2. Test all features (same as local testing)
3. Try a real payment with Razorpay test mode

### Step 8.3: Monitor

- Check Netlify function logs
- Monitor Neon database queries
- Track errors in browser console

---

## 🎉 Migration Complete!

You've successfully migrated from Supabase to Neon + Netlify Functions!

### What Changed:
- ✅ Database: Supabase PostgreSQL → Neon PostgreSQL
- ✅ Auth: Supabase Auth → Auth0
- ✅ Backend: Supabase Edge Functions → Netlify Functions
- ✅ Hosting: Ready for Netlify deployment

### What Stayed the Same:
- ✅ PostgreSQL schema (minimal changes)
- ✅ Frontend UI (no changes)
- ✅ Razorpay payment integration
- ✅ Product data structure

---

## 🆘 Troubleshooting

### Issue: Functions not working locally

```bash
# Make sure you're using netlify dev, not npm run dev
netlify dev

# Check function logs
netlify functions:log
```

### Issue: Database connection errors

```bash
# Test connection
psql "postgres://your-connection-string"

# Check if DATABASE_URL is set
netlify env:list
```

### Issue: Auth0 redirect not working

- Check callback URLs in Auth0 dashboard
- Verify VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env
- Clear browser cache and cookies

### Issue: CORS errors

- Ensure functions have proper CORS headers
- Check that API_BASE in api.ts is correct

---

## 📊 Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| **Neon** | 512MB DB | ~50MB | $0 |
| **Netlify** | 100GB bandwidth, 125K functions | <10GB, <50K | $0 |
| **Auth0** | 7,500 users | <100 | $0 |
| **Total** | | | **$0/month** |

---

## 🚀 Next Steps

1. **Add monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor function performance

2. **Optimize**
   - Add database indexes for common queries
   - Enable Neon autoscaling if needed

3. **Scale**
   - When you exceed free tiers:
     - Neon: $19/month for 10GB
     - Netlify: $19/month for 1TB bandwidth
     - Auth0: $35/month for 20K users

4. **Backup**
   - Neon has automatic backups (7 days)
   - Set up additional backup strategy if needed

---

Need help with any step? Check the troubleshooting section or reach out!
