# VAINOR - Men's Fashion E-Commerce Store

## Project Overview

**Vainor** is a full-stack men's fashion e-commerce store targeting the Indian market (INR currency). It features a customer-facing storefront, user authentication, Razorpay payment integration, order management, a blog/journal section, and a complete admin portal for managing products, orders, inventory, blog posts, and analytics.

**Brand:** VAINOR (Men's Wear Only)
**Categories:** Jeans, Shirts, Trousers, Cargo, Lowers, T-Shirt

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| **Framework**    | React 18 + TypeScript                                        |
| **Build Tool**   | Vite 5                                                       |
| **Styling**      | Tailwind CSS 3 + tailwindcss-animate                         |
| **UI Library**   | shadcn/ui (Radix UI primitives)                              |
| **Icons**        | Lucide React                                                 |
| **Routing**      | React Router v6                                              |
| **State Mgmt**   | Zustand (persisted stores for cart, wishlist, admin)          |
| **Forms**        | React Hook Form + Zod validation                             |
| **Data Fetching**| Native fetch + custom hooks (no TanStack Query usage despite being installed) |
| **Charts**       | Recharts                                                     |
| **Date Utils**   | date-fns                                                     |
| **Backend**      | Netlify Serverless Functions (Node.js)                       |
| **Database**     | PostgreSQL via Supabase (connected with `pg` driver)         |
| **Auth**         | Custom JWT-based auth (bcryptjs + jsonwebtoken)              |
| **Payments**     | Razorpay (order creation + signature verification)           |
| **Hosting**      | Netlify (build + functions + redirects)                      |
| **Testing**      | Vitest + @testing-library/react + jsdom                      |
| **Linting**      | ESLint 9 + TypeScript-ESLint                                 |

---

## Project Structure

```
├── netlify/
│   └── functions/              # Serverless API endpoints
│       ├── utils/
│       │   ├── db.ts           # PostgreSQL connection pool (pg)
│       │   ├── auth.ts         # Customer JWT verification utility
│       │   └── email.ts        # SMTP email service (nodemailer, order confirmation + shipping notification)
│       ├── admin-api.ts        # Admin CRUD API (products, orders, blog, analytics, inventory)
│       ├── admin-login.ts      # Admin JWT authentication
│       ├── auth-login.ts       # Customer login (bcrypt + JWT)
│       ├── auth-register.ts    # Customer registration
│       ├── create-razorpay-order.ts  # Razorpay order creation
│       ├── verify-payment.ts   # Razorpay signature verification + order creation
│       ├── get-products.ts     # Public product listing/detail API
│       ├── get-orders.ts       # User orders API
│       ├── get-guest-order.ts  # Guest order tracking API
│       ├── get-coupon.ts       # Coupon validation API
│       ├── get-blog-posts.ts   # Public blog posts API
│       ├── get-blog-post.ts    # Single blog post API
│       ├── update-profile.ts   # Customer profile update API
│       └── addresses.ts        # Address CRUD API (list/create/update/delete/set_default)
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── migrations/             # Database schema migrations (7 files)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx      # Main nav, search dialog, user menu, cart/wishlist icons
│   │   │   └── Footer.tsx      # Footer with links, newsletter, social media
│   │   ├── cart/
│   │   │   └── CartDrawer.tsx  # Slide-out cart drawer
│   │   ├── product/
│   │   │   ├── ProductCard.tsx # Product card component
│   │   │   └── CategoryCard.tsx# Category card component
│   │   ├── ui/                 # 45+ shadcn/ui components
│   │   └── NavLink.tsx         # Navigation link component
│   ├── pages/
│   │   ├── Index.tsx           # Home page (hero, categories, featured, new arrivals, newsletter)
│   │   ├── Shop.tsx            # Shop page (filters, sort, grid toggle, category/price/size/color filters)
│   │   ├── ProductDetail.tsx   # Product detail (images, size/color selection, stock, add to cart, wishlist, related)
│   │   ├── Cart.tsx            # Cart page
│   │   ├── Checkout.tsx        # Checkout (address form, GST calc, Razorpay payment)
│   │   ├── OrderSuccess.tsx    # Order confirmation page
│   │   ├── Auth.tsx            # Sign in / Sign up page
│   │   ├── Account.tsx         # Account dashboard (orders, addresses, profile links)
│   │   ├── Profile.tsx         # Profile settings
│   │   ├── Addresses.tsx       # Address management (add/edit/delete, set default)
│   │   ├── Orders.tsx          # Order history list
│   │   ├── OrderDetail.tsx     # Single order detail view
│   │   ├── TrackOrder.tsx      # Guest order tracking
│   │   ├── Wishlist.tsx        # Wishlist page
│   │   ├── Blog.tsx            # Blog listing (search, categories, featured post)
│   │   ├── BlogPost.tsx        # Single blog post view
│   │   ├── NotFound.tsx        # 404 page
│   │   └── admin/
│   │       ├── AdminLogin.tsx       # Admin login page
│   │       ├── AdminLayout.tsx      # Admin sidebar layout
│   │       ├── AdminDashboard.tsx   # Dashboard (stats, revenue chart, recent orders)
│   │       ├── AdminProducts.tsx    # Product list management
│   │       ├── AdminProductForm.tsx # Add/edit product form
│   │       ├── AdminInventory.tsx   # Inventory management (stock levels, low stock alerts)
│   │       ├── AdminOrders.tsx      # Order management (status updates, tracking)
│   │       ├── AdminBlog.tsx        # Blog post management
│   │       ├── AdminBlogForm.tsx    # Add/edit blog posts (with SEO fields)
│   │       ├── AdminBlogCategories.tsx # Blog category management
│   │       └── AdminAnalytics.tsx   # Analytics (sales, revenue, views)
│   ├── stores/
│   │   ├── cartStore.ts        # Cart state (Zustand, persisted to localStorage)
│   │   ├── wishlistStore.ts    # Wishlist state (Zustand, persisted)
│   │   └── adminStore.ts       # Admin auth state + API helper (Zustand, persisted)
│   ├── hooks/
│   │   ├── useAuth.ts          # Customer auth hook (useSyncExternalStore pattern)
│   │   ├── useProducts.ts      # Product fetching hook (API + static fallback)
│   │   ├── useRazorpay.ts      # Razorpay payment hook (script loading, order creation, verification)
│   │   ├── use-toast.ts        # Toast notification hook
│   │   └── use-mobile.tsx      # Mobile detection hook
│   ├── data/
│   │   └── products.ts         # Static fallback product data (3 men's products, 1 category with 6 subcategories)
│   ├── lib/
│   │   ├── api.ts              # Base API call utility
│   │   └── utils.ts            # Tailwind class merge utility (cn)
│   ├── test/
│   │   ├── setup.ts            # Test setup (jsdom)
│   │   └── example.test.ts     # Example test
│   ├── App.tsx                 # Root component with routing
│   └── main.tsx                # App entry point
├── netlify.toml                # Netlify build config + function routing
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Database Schema

**Database:** PostgreSQL (Supabase) with Row Level Security (RLS)

### Tables

| Table               | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `users`             | Customer accounts (email, password_hash, name) |
| `profiles`          | Extended user profile info                   |
| `user_roles`        | Role assignment (customer / admin enum)      |
| `admin_users`       | Separate admin user table                    |
| `addresses`         | Saved shipping addresses                     |
| `categories`        | Product categories (hierarchical with parent_id) |
| `products`          | Product catalog (price, stock, images, sizes, colors as JSONB) |
| `carts`             | Shopping carts (user or session-based)       |
| `cart_items`        | Cart line items                              |
| `wishlists`         | User wishlists                               |
| `wishlist_items`    | Wishlist entries                             |
| `orders`            | Orders (status enum, shipping/billing JSONB, payment info) |
| `order_items`       | Order line items                             |
| `coupons`           | Discount coupons (percentage/fixed, limits, expiry) |
| `inventory_log`     | Stock change audit log                       |
| `blog_posts`        | Blog articles (with SEO fields, scheduling)  |
| `blog_categories`   | Blog categories                              |
| `product_views`     | Product view tracking (analytics)            |
| `product_sales_stats` | Aggregated sales stats view               |

### Key Features
- **Enums:** `app_role` (customer, admin), `order_status` (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- **RLS Policies:** Comprehensive row-level security on all tables
- **Triggers:** Auto-generate order numbers, auto-update `updated_at`, auto-create profile on user signup
- **Indexes:** On category_id, is_active, is_featured, user_id, status, cart_id, order_id

---

## Frontend Features

### IMPLEMENTED

#### Customer Storefront
- **Home Page:** Hero banner with CTA, trust badges (free shipping, returns, secure payment, sustainable), category cards, featured products grid, new arrivals grid, sustainability banner, newsletter signup form
- **Shop Page:** Product grid with 2/4 column toggle, sidebar filters (subcategory, price range, size, color), sort (newest, price asc/desc, popular), mobile filter drawer, search support via URL params, loading states
- **Product Detail:** Image gallery with thumbnails, size/color selection, quantity selector (respects stock limits), add to cart with validation, wishlist toggle, stock status badges (in stock, low stock, out of stock), discount percentage display, breadcrumb navigation, related products section, trust badges
- **Cart:** Slide-out cart drawer, full cart page, quantity adjustment with stock validation, item removal
- **Checkout:** Shipping address form with Zod validation, order summary with item thumbnails, GST calculation (5% for items <= 2500, 18% for items > 2500), free shipping threshold (2500), Razorpay payment integration, coupon code input with validation (percentage/fixed discount types, min order check, usage limit check), stock deduction on purchase, order confirmation email via SMTP
- **Order Success:** Confirmation page with order number

#### User Account
- **Authentication:** Custom JWT auth (sign in / sign up), password show/hide toggle, form validation, auto-redirect when logged in, global auth state via `useSyncExternalStore`
- **Account Dashboard:** User info display, navigation to orders/addresses/profile
- **My Orders:** Order history list with status badges (color-coded), order details view
- **Order Detail:** Full order breakdown with items, shipping address, payment info, tracking info
- **Guest Order Tracking:** Track order by order number + email (no login required)
- **Addresses:** Add/edit/delete addresses via dialog, set default address, persisted to database via authenticated API
- **Profile Settings:** Profile update with backend persistence (first_name, last_name, phone), syncs global auth state on save
- **Wishlist:** Add/remove products, persistent via localStorage

#### Blog / Journal
- **Blog Listing:** Hero section with search, category filter chips, featured post (large card), regular posts grid, newsletter CTA
- **Blog Post:** Single post view with full content

#### Search
- **Product Search:** Dialog-based search from header, real-time results with product thumbnails, "View all results" link to shop page with search param

#### UI/UX
- **Responsive:** Mobile-first design, mobile hamburger menu, mobile filter drawer
- **Header:** Fixed/sticky with glass effect on scroll, logo, nav links, search, user dropdown, wishlist badge, cart badge
- **Footer:** Newsletter form, shop/help/about link columns, social media icons, privacy/terms links
- **Notifications:** Toast notifications (shadcn/ui Toaster + Sonner)
- **Loading States:** Spinner indicators on all async operations

### Admin Portal

#### Implemented
- **Admin Login:** Separate JWT authentication against `admin_users` table, bcrypt password hashing with initial setup fallback
- **Admin Dashboard:** Total orders, total revenue, today's orders, pending orders, low stock products count, recent orders list, revenue chart (last 7 days)
- **Product Management:** Product list view, add/edit product form (name, slug, description, price, original price, category, subcategory, images, sizes, colors, stock, active/featured/new flags), delete products
- **Inventory Management:** Stock level overview, low stock alerts (< 10 items), stock adjustment with audit logging (quantity change, change type, notes, admin ID)
- **Order Management:** Order list with items, update order status (pending -> confirmed -> processing -> shipped -> delivered / cancelled / refunded), add tracking numbers, automatic shipped_at/delivered_at timestamps, shipping notification email sent automatically when status set to "shipped"
- **Blog Management:** Blog post CRUD (title, slug, excerpt, content, featured image, category, tags), SEO fields (meta title, meta description, meta keywords, canonical URL, OG image), post scheduling, draft/published status, blog category management
- **Analytics:** Product sales stats, revenue over 30 days (daily breakdown), product view tracking (top 10 most viewed)
- **Protected Routes:** All admin routes wrapped in `AdminProtectedRoute` with JWT verification
- **Admin Layout:** Sidebar navigation with sections for dashboard, products, inventory, orders, blog, analytics

---

## Backend API Endpoints

### Public Endpoints

| Endpoint             | Method | Description                                |
| -------------------- | ------ | ------------------------------------------ |
| `get-products`       | GET    | List products (filter by category, featured, new, search) or get single product by ID |
| `get-blog-posts`     | GET    | List published blog posts (cached 5 min)   |
| `get-blog-post`      | GET    | Get single blog post by slug               |
| `get-coupon`         | POST   | Validate coupon code                       |

### Auth Endpoints

| Endpoint             | Method | Description                                |
| -------------------- | ------ | ------------------------------------------ |
| `auth-register`      | POST   | Register new user (bcrypt hash, JWT token) |
| `auth-login`         | POST   | Login user (bcrypt compare, JWT token)     |
| `admin-login`        | POST   | Admin login (separate admin_users table)   |

### Authenticated Endpoints

| Endpoint             | Method | Description                                |
| -------------------- | ------ | ------------------------------------------ |
| `get-orders`         | POST   | Get user's orders with items               |
| `get-order`          | POST   | Get single order detail                    |
| `get-guest-order`    | POST   | Track order by order number + email        |
| `create-razorpay-order` | POST | Create Razorpay payment order           |
| `verify-payment`     | POST   | Verify Razorpay signature + create order in DB + stock deduction + coupon usage + order confirmation email |
| `update-profile`     | POST   | Update customer profile (first_name, last_name, phone) |
| `addresses`          | POST   | Address CRUD (action: list/create/update/delete/set_default) |

### Admin API (all require Bearer token)

| Path                  | Method | Description                               |
| --------------------- | ------ | ----------------------------------------- |
| `dashboard/stats`     | GET    | Dashboard statistics                      |
| `products`            | GET    | List all products                         |
| `products`            | POST   | Create product                            |
| `products/:id`        | PUT    | Update product                            |
| `products/:id`        | DELETE | Delete product                            |
| `inventory/update`    | POST   | Adjust stock with audit log               |
| `inventory/log`       | GET    | View inventory change history             |
| `inventory/low-stock` | GET    | Get low stock products (< 10)             |
| `orders`              | GET    | List all orders with items                |
| `orders/:id/status`   | PUT    | Update order status + tracking            |
| `blog/posts`          | GET    | List all blog posts (admin)               |
| `blog/posts`          | POST   | Create blog post                          |
| `blog/posts/:id`      | PUT    | Update blog post                          |
| `blog/posts/:id`      | DELETE | Delete blog post                          |
| `blog/categories`     | GET    | List blog categories                      |
| `categories`          | GET    | List product categories                   |
| `analytics/sales`     | GET    | Product sales statistics                  |
| `analytics/revenue`   | GET    | Revenue over 30 days                      |
| `analytics/views`     | GET    | Product views (top 10, last 30 days)      |

---

## State Management

| Store           | Persistence      | Purpose                                      |
| --------------- | ---------------- | -------------------------------------------- |
| `cartStore`     | localStorage     | Cart items, drawer open/close, totals        |
| `wishlistStore` | localStorage     | Wishlist items                               |
| `adminStore`    | localStorage     | Admin JWT token, admin user info, auth state |
| Auth (global)   | localStorage     | Customer JWT token, user info (via useSyncExternalStore) |

---

## Payment Flow

1. Customer fills checkout form (Zod validation), optionally applies coupon code
2. Frontend calls `create-razorpay-order` with amount in paise (after discount)
3. Backend creates order via Razorpay API, returns order_id + key_id
4. Razorpay checkout modal opens in browser
5. On successful payment, Razorpay returns payment_id, order_id, signature
6. Frontend calls `verify-payment` with signature + order data (including discount, coupon_code)
7. Backend verifies HMAC SHA256 signature against Razorpay secret
8. Backend creates order + order_items in database
9. Backend deducts stock for DB products (UUID-based), logs to inventory_log
10. Backend increments coupon usage count if coupon was applied
11. Backend sends order confirmation email via SMTP (non-fatal)
12. Frontend clears cart and navigates to order success page

---

## Environment Variables Required

| Variable              | Purpose                           |
| --------------------- | --------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string      |
| `RAZORPAY_KEY_ID`     | Razorpay public key               |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key               |
| `JWT_SECRET`          | JWT signing secret for auth       |
| `SMTP_HOST`           | SMTP server host (default: mail.vainor.com) |
| `SMTP_PORT`           | SMTP server port (default: 465)   |
| `SMTP_USER`           | SMTP username (default: order@vainor.com) |
| `SMTP_PASS`           | SMTP password                     |

---

## What's PENDING / NOT IMPLEMENTED

### High Priority
1. **Newsletter Subscription** - Form exists on home page, blog page, and footer but has NO backend logic (no endpoint, no email service integration)
2. ~~**Address Persistence**~~ - **IMPLEMENTED** — Addresses CRUD via `netlify/functions/addresses.ts` (list/create/update/delete/set_default), wired to `src/pages/Addresses.tsx` with JWT-authenticated API calls
3. ~~**Profile Update**~~ - **IMPLEMENTED** — `netlify/functions/update-profile.ts` updates `users` + upserts `profiles` table; `src/pages/Profile.tsx` uses authenticated API call + `updateAuthUser()` to sync global state
4. ~~**Coupon Application at Checkout**~~ - **IMPLEMENTED** — Checkout page has coupon input field, validates via `get-coupon` API (min order, usage limits), calculates percentage/fixed discounts, passes discount + coupon_code to `verify-payment`; coupon `used_count` incremented on purchase
5. ~~**Stock Deduction on Purchase**~~ - **IMPLEMENTED** — `verify-payment.ts` deducts `stock_quantity` for UUID-based DB products after order creation, logs changes to `inventory_log` table; non-fatal (won't break payment on failure)
6. ~~**Email Notifications**~~ - **IMPLEMENTED** — SMTP via HostGator (`mail.vainor.com:465`); `sendOrderConfirmation` sent after payment verification; `sendShippingNotification` sent when admin marks order as shipped; uses `nodemailer` with branded HTML templates; non-fatal (email failures don't break payment/status flows)

### Medium Priority
7. **Password Reset / Forgot Password** - No password recovery flow
8. **User Profile Photo** - Avatar placeholder exists but no upload functionality
9. **Product Reviews/Ratings System** - Rating display exists on product cards but no way for users to submit reviews; ratings are static
11. **Search on Mobile** - Header search dialog only available on desktop (`hidden md:flex` on search button)
12. **Cart Persistence to Database** - Cart is localStorage-only; `carts` and `cart_items` tables exist in DB but are unused
13. **Wishlist Persistence to Database** - Wishlist is localStorage-only; `wishlists` and `wishlist_items` tables exist in DB but are unused
14. **Blog Post Edit** - Admin blog edit route exists (`/blog/:id`) but `get-blog-post` for admin (fetching by ID with full content) needs verification
15. **Admin Coupon Management** - Coupons table exists but no admin UI for creating/managing coupons

### Low Priority / Nice-to-Have
16. **Static Pages Missing** - Footer links to pages that don't exist: `/about`, `/sustainability`, `/contact`, `/shipping`, `/size-guide`, `/faq`, `/careers`, `/press`, `/privacy`, `/terms`
17. **Pagination** - No pagination on shop page, orders page, or admin lists (all data loaded at once)
18. **Image Upload** - Product images and blog images use URLs only; no file upload integration (e.g., Cloudinary, S3)
19. **SEO / Meta Tags** - Blog posts have SEO fields in the database but no `<meta>` tag rendering on the frontend (no react-helmet or similar)
20. **Dark Mode** - `next-themes` package is installed but not used
21. **Internationalization (i18n)** - Hardcoded to English + INR
22. **Order Cancellation/Refund** - Status exists in the enum but no customer-facing cancellation flow
23. **Product Variants with Separate Stock** - Stock is tracked at the product level, not per size/color combination
24. **Admin User Management** - No UI to create/manage additional admin users
25. **Analytics Tracking** - `product_views` table exists but no frontend tracking code to record page views
26. **Rate Limiting** - No rate limiting on API endpoints
27. **CORS Configuration** - Uses `Access-Control-Allow-Origin: *` (should be restricted in production)
28. **JWT Secret Hardcoded Fallback** - Both auth and admin use fallback secret keys in code (security risk in production)
29. **TanStack Query Unused** - `@tanstack/react-query` is installed as a dependency but never used (all fetching is manual)
30. **Test Coverage** - Only one example test exists; no meaningful test coverage

---

## Security Concerns

1. **Hardcoded JWT fallback secrets** in `auth-register.ts`, `auth-login.ts`, and `admin-login.ts` (`'your-secret-key-change-in-production'` / `'vainor-admin-secret-key-change-in-production'`)
2. **Admin login fallback** - `admin-login.ts` has a plaintext password fallback (`Admin@123`) that bypasses bcrypt verification
3. **CORS wildcard** - All API endpoints use `Access-Control-Allow-Origin: *`
4. **No rate limiting** on authentication endpoints (brute force vulnerable)
5. **User ID passed from client** in `get-orders` endpoint (should be extracted from JWT token instead)
6. **No CSRF protection** on any endpoints
7. **SSL `rejectUnauthorized: false`** in database connection config

---

## Build & Development

```bash
# Install dependencies
npm install

# Local development (with Netlify Functions)
netlify dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Deployment
- Deployed on **Netlify**
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- API redirect: `/api/*` -> `/.netlify/functions/:splat`
