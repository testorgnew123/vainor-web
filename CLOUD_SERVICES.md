# Cloud/Remote Components Used in Atelier E-Commerce Project

## Summary
Apart from the database, this project uses **3 main cloud/remote services** plus external image hosting.

---

## 1. 🗄️ **Supabase** (Primary Backend Platform)

### Project Details
- **Project URL**: `https://dnxntcmlwizbqvhcanvy.supabase.co`
- **Project ID**: `dnxntcmlwizbqvhcanvy`
- **Service**: Backend-as-a-Service (BaaS)

### Components Used:

#### a) **PostgreSQL Database** ✅
- Primary data storage
- Tables: products, orders, users, coupons, carts, wishlists, addresses, etc.
- Row-Level Security (RLS) enabled
- Location: Supabase Cloud

#### b) **Authentication Service** 🔐
- Email/password authentication
- Session management (localStorage)
- Auto token refresh
- User profile management
- Role-based access control (customer/admin)
- **Package**: `@supabase/auth-js@2.93.3`

#### c) **Edge Functions** ⚡ (Serverless Functions)
Located in: `supabase/functions/`

Three Deno-based serverless functions:

1. **create-razorpay-order**
   - Creates Razorpay payment orders
   - Validates amount, currency, notes
   - Returns order_id for payment processing

2. **verify-razorpay-payment**
   - Verifies payment signature using HMAC
   - Creates order records in database
   - Handles order item creation
   - Most complex function (~456 lines with extensive validation)

3. **get-guest-order**
   - Allows guests to track orders by email + order number
   - Rate limited (5 requests/minute per IP)
   - Validates email and order number format

**Runtime**: Deno (not Node.js)
**Deployment**: Supabase Edge Functions platform

#### d) **Realtime** 📡 (Available but not actively used)
- **Package**: `@supabase/realtime-js@2.93.3`
- Installed but not implemented in current codebase
- Could be used for: live order updates, cart sync, inventory updates

#### e) **Storage** 📦 (Available but not actively used)
- **Package**: `@supabase/storage-js@2.93.3`
- Currently NOT being used
- Product images are from Unsplash (external CDN)
- Could be used for: user profile photos, product image uploads

#### f) **PostgREST API** 🔌
- **Package**: `@supabase/postgrest-js@2.93.3`
- Automatic REST API for database
- Used for all CRUD operations (coupons, orders, etc.)

---

## 2. 💳 **Razorpay** (Payment Gateway)

### Service Details
- **Type**: Payment Processing Platform (Indian payment gateway)
- **Integration**: Client-side + Server-side
- **Script**: `https://checkout.razorpay.com/v1/checkout.js`

### Components:

#### a) **Checkout SDK** (Client-side)
- Loaded dynamically via script tag
- Opens modal for payment collection
- Supports: UPI, Cards, NetBanking, Wallets
- Theme color: `#000000` (black)

#### b) **API Integration** (Server-side via Edge Functions)
- Order creation via `create-razorpay-order` function
- Payment verification via `verify-razorpay-payment` function
- HMAC signature validation for security
- Webhook handling capabilities

### Configuration Needed
- Razorpay Key ID (passed from edge function)
- Razorpay Secret (stored in edge function environment)
- Currency support: INR, USD, EUR, GBP
- Amount range: ₹1 to ₹100,000

---

## 3. 🖼️ **Unsplash** (Image CDN - External)

### Service Details
- **Type**: External image hosting/CDN
- **Usage**: Demo product images and hero images
- **URL Pattern**: `https://images.unsplash.com/photo-*?w=800&q=80`

### Used In:
- All product images in `src/data/products.ts`
- Hero banners in `src/pages/Index.tsx`
- Category showcase images

### Image Parameters:
- `w=800` or `w=1920` - Width in pixels
- `q=80` - Quality setting

**Note**: This is only for demo/development. Production should use:
- Supabase Storage (already available)
- Or dedicated CDN like Cloudinary, imgix

---

## 4. 🌐 **No Other External Services**

The project does NOT use:
- ❌ AWS services
- ❌ Google Cloud Platform
- ❌ Firebase
- ❌ Stripe (uses Razorpay instead)
- ❌ SendGrid/Mailgun (no email service integrated)
- ❌ Twilio (no SMS service)
- ❌ Redis/Caching layer
- ❌ Analytics (Google Analytics, Mixpanel, etc.)
- ❌ Error tracking (Sentry, etc.)

---

## Configuration Files

### Environment Variables (`.env`)
```env
VITE_SUPABASE_PROJECT_ID="dnxntcmlwizbqvhcanvy"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
VITE_SUPABASE_URL="https://dnxntcmlwizbqvhcanvy.supabase.co"
```

### Supabase Config (`supabase/config.toml`)
```toml
[functions.create-razorpay-order]
[functions.verify-razorpay-payment]
[functions.get-guest-order]
```

---

## Data Flow Architecture

```
Frontend (React + Vite)
    ↓
    ├─→ Supabase Client SDK (@supabase/supabase-js)
    │   ├─→ Auth Service (login/signup)
    │   ├─→ PostgREST API (CRUD operations)
    │   └─→ Edge Functions (payment processing)
    │
    ├─→ Razorpay Checkout (payment collection)
    │   ↓
    │   Supabase Edge Function (verification)
    │
    └─→ Unsplash CDN (images)
```

---

## Network Calls Made

### To Supabase (`*.supabase.co`):
1. Authentication requests
2. Database queries (SELECT, INSERT, UPDATE)
3. Edge function invocations
4. Real-time subscriptions (if enabled)

### To Razorpay (`checkout.razorpay.com`):
1. Load checkout SDK script
2. Payment modal interaction
3. Payment submission

### To Unsplash (`images.unsplash.com`):
1. Product image loading
2. Hero image loading

---

## Cost Implications

### Supabase
- **Free Tier**: 500MB database, 50MB file storage, 2GB bandwidth
- **Paid Plans**: Start at $25/month (Pro plan)
- Current usage: Likely within free tier for development

### Razorpay
- **Transaction Fee**: 2% per transaction
- **No setup fees or annual maintenance**
- Only charges on successful payments

### Unsplash
- **Free** for development/demo
- Production: Should migrate to own hosting/CDN

---

## Deployment Considerations

### What needs cloud hosting:
1. **Frontend** (React app)
   - Can deploy to: Vercel, Netlify, Cloudflare Pages
   - Current: Not deployed (local development)

2. **Edge Functions**
   - Already deployed on: Supabase Edge Functions
   - Auto-deployed when pushing to Supabase

3. **Database**
   - Already hosted on: Supabase Cloud
   - No additional deployment needed

### What runs locally:
- Nothing! All services are cloud-based
- Development server (Vite) runs locally
- Production build would be static files

---

## Security Notes

### API Keys/Secrets:
1. **Supabase Publishable Key** ✅ (Safe to expose - anon key)
2. **Razorpay Key ID** ✅ (Safe to expose - public key)
3. **Razorpay Secret** 🔒 (Must be secret - in edge function)
4. **Supabase Service Role Key** 🔒 (Must be secret - not in code)

### All sensitive operations happen server-side via Edge Functions:
- Payment verification
- Order creation
- Admin operations

---

## Recommendation for Production

### Should Add:
1. **Email Service** (Supabase Auth + SendGrid/Resend)
   - Order confirmations
   - Shipping notifications
   - Password reset emails

2. **Analytics** (Google Analytics 4 or Plausible)
   - User behavior tracking
   - Conversion tracking
   - Traffic analysis

3. **Error Tracking** (Sentry)
   - Frontend error monitoring
   - Edge function error tracking

4. **CDN for Images** (Supabase Storage or Cloudinary)
   - Replace Unsplash URLs
   - Product image uploads
   - Image optimization

5. **Monitoring** (Supabase Dashboard + custom alerts)
   - Edge function performance
   - Database query performance
   - Payment success rates

---

## Summary Table

| Service | Type | Purpose | Cost | Status |
|---------|------|---------|------|--------|
| **Supabase** | BaaS | Database, Auth, Edge Functions | Free tier / $25+ | ✅ Active |
| **Razorpay** | Payment Gateway | Payment processing | 2% per transaction | ✅ Active |
| **Unsplash** | Image CDN | Product images (demo) | Free | ⚠️ Demo only |

**Total Monthly Cost (Development)**: $0
**Total Monthly Cost (Production, estimated)**: $25-50 (Supabase) + 2% transaction fees

---

**Last Updated**: February 1, 2026
