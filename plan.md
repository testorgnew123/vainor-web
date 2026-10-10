# Admin Portal and Guest Order Linking Implementation Plan

## Overview

This plan addresses two key requirements:
1. **Guest Order Email Linking** - Allow guest checkout orders to be linked to accounts when users sign up or log in with the same email
2. **Admin Portal** - A comprehensive dashboard for managing orders, products, users, inventory, and viewing sales analytics

---

## Part 1: Guest Order Email Linking

### Current State
- Orders table has `user_id` (nullable) for guest checkout support
- Guest orders store customer email in `shipping_address` JSONB field
- When users log in, they only see orders where `user_id` matches their ID

### Solution

#### 1.1 Database Changes

Add an `email` column to the `orders` table:

```sql
ALTER TABLE public.orders 
ADD COLUMN email text;

-- Create index for efficient email lookups
CREATE INDEX idx_orders_email ON public.orders(email);
```

#### 1.2 Edge Function Update

Modify `verify-razorpay-payment/index.ts` to:
- Extract and store the email from `shipping_address` into the new `email` column
- When inserting the order, include the email field

#### 1.3 Order Claiming on Login/Signup

Create a database function that runs after user authentication to claim unclaimed orders:

```sql
CREATE OR REPLACE FUNCTION public.claim_guest_orders(user_email text, for_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
  SET user_id = for_user_id
  WHERE email = user_email
    AND user_id IS NULL;
END;
$$;
```

#### 1.4 Frontend Integration

Modify `useAuth.ts` to call the claim function after successful login:
- After `signIn` succeeds, call an edge function or RPC to claim orders
- After `signUp` email verification completes, claim orders

#### 1.5 RLS Policy Update

Update the orders RLS policy to allow users to view orders by email OR user_id:

```sql
-- Allow authenticated users to view orders matching their email
CREATE POLICY "Users can view orders by email"
ON public.orders FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR (user_id IS NULL AND email = auth.email())
);
```

---

## Part 2: Admin Portal

### Architecture Overview

```text
+------------------+     +------------------+     +------------------+
|   Admin Layout   | --> |  Admin Sidebar   | --> |   Admin Pages    |
|  (Protected)     |     |  (Navigation)    |     | (Dashboard, etc) |
+------------------+     +------------------+     +------------------+
         |
         v
+------------------+
|   Role Check     |
|  (isAdmin hook)  |
+------------------+
```

### 2.1 Route Structure

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | AdminDashboard | Sales analytics overview |
| `/admin/orders` | AdminOrders | Order list and management |
| `/admin/orders/:id` | AdminOrderDetail | Order details and status updates |
| `/admin/products` | AdminProducts | Product listing |
| `/admin/products/new` | AdminProductForm | Create product |
| `/admin/products/:id` | AdminProductForm | Edit product |
| `/admin/users` | AdminUsers | User management |
| `/admin/inventory` | AdminInventory | Stock control |

### 2.2 Components to Create

**Layout Components:**
- `src/components/admin/AdminLayout.tsx` - Main layout with sidebar
- `src/components/admin/AdminSidebar.tsx` - Navigation menu
- `src/components/admin/AdminHeader.tsx` - Top bar with user info

**Dashboard Components:**
- `src/components/admin/dashboard/RevenueChart.tsx` - Revenue over time
- `src/components/admin/dashboard/OrdersChart.tsx` - Order trends
- `src/components/admin/dashboard/TopProductsTable.tsx` - Best sellers
- `src/components/admin/dashboard/StatsCards.tsx` - KPI cards

**Order Management:**
- `src/components/admin/orders/OrdersTable.tsx` - Filterable order list
- `src/components/admin/orders/OrderStatusBadge.tsx` - Status display
- `src/components/admin/orders/OrderActions.tsx` - Update status, tracking

**Product Management:**
- `src/components/admin/products/ProductsTable.tsx` - Product list
- `src/components/admin/products/ProductForm.tsx` - Create/edit form
- `src/components/admin/products/ImageUpload.tsx` - Image management

**User Management:**
- `src/components/admin/users/UsersTable.tsx` - User list
- `src/components/admin/users/UserActions.tsx` - Block/unblock

**Inventory:**
- `src/components/admin/inventory/InventoryTable.tsx` - Stock levels
- `src/components/admin/inventory/LowStockAlert.tsx` - Warnings

### 2.3 Page Components

- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/OrderDetail.tsx`
- `src/pages/admin/Products.tsx`
- `src/pages/admin/ProductForm.tsx`
- `src/pages/admin/Users.tsx`
- `src/pages/admin/Inventory.tsx`

### 2.4 Database Changes for Admin Features

#### User Blocking
Add a `is_blocked` column to profiles:

```sql
ALTER TABLE public.profiles
ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
```

#### Admin-specific RLS Policies
Already exist via `is_admin()` function - policies are in place for:
- Viewing all orders, profiles, addresses
- Managing products, categories, coupons
- Managing user roles

### 2.5 Protected Route Component

Create `src/components/admin/AdminRoute.tsx`:
- Check if user is authenticated
- Check if user has admin role via `useAuth().isAdmin`
- Redirect to home or show "Access Denied" if not admin

### 2.6 Supabase Storage Setup

Create a storage bucket for product images:
- Bucket name: `product-images`
- Public access for reading
- Authenticated access for uploading (admins only)

---

## Implementation Phases

### Phase 1: Database Setup
1. Add `email` column to orders table
2. Add `is_blocked` column to profiles table
3. Create `claim_guest_orders` function
4. Update RLS policies for email-based order access
5. Create product images storage bucket

### Phase 2: Guest Order Linking
1. Update `verify-razorpay-payment` edge function to store email
2. Create edge function for claiming guest orders
3. Modify `useAuth.ts` to claim orders on login
4. Test guest checkout and order claiming flow

### Phase 3: Admin Layout and Navigation
1. Create `AdminLayout.tsx` with sidebar
2. Create `AdminSidebar.tsx` with navigation
3. Create `AdminRoute.tsx` protected route wrapper
4. Add admin routes to `App.tsx`

### Phase 4: Sales Analytics Dashboard
1. Create analytics data fetching hooks
2. Build `StatsCards` component (revenue, orders, customers, avg order value)
3. Build `RevenueChart` component using Recharts
4. Build `OrdersChart` component
5. Build `TopProductsTable` component

### Phase 5: Order Management
1. Create `AdminOrders` page with filterable table
2. Create `AdminOrderDetail` page with status updates
3. Add tracking number input and update functionality
4. Add order status change with timestamps

### Phase 6: Product Management
1. Create `AdminProducts` page with product table
2. Create `AdminProductForm` for create/edit
3. Implement image upload to storage
4. Handle product activation/deactivation

### Phase 7: User Management
1. Create `AdminUsers` page with user list
2. Show user details (name, email, orders count)
3. Implement block/unblock functionality
4. Show user order history

### Phase 8: Inventory Control
1. Create `AdminInventory` page
2. Display stock levels per product
3. Add quick stock update functionality
4. Show low stock alerts (configurable threshold)

---

## Technical Details

### Admin Layout Structure

```text
+------------------------------------------------+
|               Header (Admin Name, Logout)       |
+------------+-----------------------------------+
|            |                                   |
|  Sidebar   |         Main Content              |
| - Dashboard|         (Router Outlet)           |
| - Orders   |                                   |
| - Products |                                   |
| - Users    |                                   |
| - Inventory|                                   |
|            |                                   |
+------------+-----------------------------------+
```

### Analytics Queries

Revenue and order stats will use aggregation queries:

```sql
-- Daily revenue for last 30 days
SELECT 
  DATE(created_at) as date,
  SUM(total) as revenue,
  COUNT(*) as order_count
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY date;
```

### File Structure

```text
src/
  pages/
    admin/
      Dashboard.tsx
      Orders.tsx
      OrderDetail.tsx
      Products.tsx
      ProductForm.tsx
      Users.tsx
      Inventory.tsx
  components/
    admin/
      AdminLayout.tsx
      AdminSidebar.tsx
      AdminHeader.tsx
      AdminRoute.tsx
      dashboard/
        StatsCards.tsx
        RevenueChart.tsx
        OrdersChart.tsx
        TopProductsTable.tsx
      orders/
        OrdersTable.tsx
        OrderStatusSelect.tsx
      products/
        ProductsTable.tsx
        ProductForm.tsx
        ImageUpload.tsx
      users/
        UsersTable.tsx
        UserBlockDialog.tsx
      inventory/
        InventoryTable.tsx
        StockUpdateDialog.tsx
  hooks/
    useAdminStats.ts
    useAdminOrders.ts
    useAdminProducts.ts
    useAdminUsers.ts
```

---

## Security Considerations

1. **Role Verification**: All admin API calls verify role server-side via RLS policies
2. **No Client-Side Role Storage**: Admin status checked via database, not localStorage
3. **Secure Image Upload**: Storage policies restrict uploads to authenticated admins
4. **Audit Trail**: Order status changes include timestamps (shipped_at, delivered_at)

---

## Migration from Static Products

The current app uses static product data (`src/data/products.ts`). The admin panel will:
1. Initially seed the database `products` table with static data
2. Switch the shop pages to fetch from database
3. Allow product management through admin interface

---

## Expected Outcomes

After implementation:
1. Guest customers placing orders can see those orders after creating an account with the same email
2. Admins can access a dedicated portal at `/admin`
3. Admins can view and manage all orders, update statuses, add tracking
4. Admins can create, edit, and manage products with images
5. Admins can view users and block problematic accounts
6. Admins can see real-time analytics on sales performance
7. Admins can monitor and update inventory levels