# Migration Setup Instructions

## ✅ What's Been Done

Your app uses custom JWT-based authentication with Neon PostgreSQL! Here's what has been set up:

1. ✅ **Custom JWT Authentication**
   - User registration with bcrypt password hashing
   - User login with JWT token generation
   - `useAuth` hook for authentication state management
   - Custom login/register forms on `/auth` page

2. ✅ **Netlify Functions Created**
   - `auth-register.ts` - Register new users with bcrypt password hashing
   - `auth-login.ts` - Validate credentials and return JWT token
   - `get-coupon.ts` - Validate and fetch coupons
   - `create-razorpay-order.ts` - Create Razorpay orders
   - `verify-payment.ts` - Verify payments and create orders
   - `get-orders.ts` - Fetch user orders
   - `get-guest-order.ts` - Track guest orders
   - `get-order.ts` - Get single order details
   - `utils/db.ts` - Database connection utility

3. ✅ **Frontend Updated**
   - All API calls use Netlify Functions
   - `Cart.tsx` - Uses coupon API
   - `Orders.tsx` - Uses orders API
   - `TrackOrder.tsx` - Uses guest order API
   - `useRazorpay.ts` - Uses payment APIs
   - `Auth.tsx` - Custom login/register form

4. ✅ **Neon Schema Created**
   - `neon_schema.sql` - Complete database schema for Neon
   - `users` table for authentication
   - Includes sample coupons

## 🚀 Quick Start

### Step 1: Set Up Environment Variables

Create a `.env` file with these variables (see `.env.example`):

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Secret (use a strong random string in production!)
JWT_SECRET=your-secret-key-change-in-production

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Step 2: Set Up Database

**Option A: Fresh Database Setup**
```bash
node setup-neon-db.cjs
```

**Option B: Add Users Table to Existing Database**
```bash
node migrate-add-users.cjs
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Test Locally with Netlify Dev

```bash
# Install Netlify CLI globally (if not already installed)
npm install -g netlify-cli

# Start the development server
netlify dev
```

This will start:
- Frontend on `http://localhost:8888`
- Netlify Functions on `http://localhost:8888/.netlify/functions/*`

### Step 5: Test the App

1. **Test Authentication**:
   - Visit `http://localhost:8888/auth`
   - Create a new account
   - Log in with your credentials
   - Verify you're redirected to the homepage

2. **Test Coupons**:
   - Add items to cart
   - Go to cart page
   - Try applying a coupon: `VIP15`, `WELCOME10`, `SAVE20`, etc.
   - Verify the discount is applied

3. **Test Checkout**:
   - Go through checkout flow
   - Test with Razorpay test mode
   - Verify order is created

4. **Test Order History**:
   - View your orders on the Orders page
   - Verify order details are displayed

## 🚀 Deploy to Netlify

1. **Commit your changes**:
```bash
git add .
git commit -m "Deploy with custom JWT authentication"
git push origin main
```

2. **Set up Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Functions directory: `netlify/functions`

3. **Set environment variables in Netlify**:
   - Go to Site settings → Environment variables
   - Add:
     - `DATABASE_URL` (your Neon connection string)
     - `JWT_SECRET` (a strong random string - different from development!)
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`

4. **Deploy!**

## 🔐 Security Notes

- **JWT_SECRET**: Use a strong, random string (at least 32 characters). Never commit this to git.
- **Password Hashing**: Passwords are hashed with bcrypt (10 salt rounds) before storage.
- **Token Expiry**: JWT tokens expire after 7 days.
- **HTTPS**: Always use HTTPS in production.

## 🔍 Troubleshooting

### Database Connection Errors
1. Verify your DATABASE_URL is correct
2. Check that your IP is allowed in Neon

### Authentication Not Working
1. Make sure JWT_SECRET is set in your environment
2. Clear localStorage and try again
3. Check browser console for errors

### Netlify Functions Not Working
1. Use `netlify dev`, not `npm run dev`
2. Check function logs: `netlify functions:log`
3. Verify environment variables: `netlify env:list`

## 📊 Architecture

- **Database**: Neon PostgreSQL
- **Authentication**: Custom JWT with bcrypt password hashing
- **Backend**: Netlify Functions
- **Frontend**: React + Vite + TypeScript
- **Hosting**: Netlify
- **Payment**: Razorpay

## 💰 Free Tier Limits

- **Neon**: 512MB database, 5GB storage
- **Netlify**: 100GB bandwidth, 125K function invocations/month
- **Total Cost**: $0/month
