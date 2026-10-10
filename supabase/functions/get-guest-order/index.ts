import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting: Simple in-memory store (per function instance)
// In production, consider using Redis or Supabase for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // Per minute

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

interface GuestOrderRequest {
  order_id?: string;
  order_number?: string;
  email: string;
}

function validateRequest(body: unknown): { valid: boolean; error?: string; data?: GuestOrderRequest } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate email
  if (typeof req.email !== "string" || !isValidEmail(req.email)) {
    return { valid: false, error: "Valid email is required" };
  }

  // Require either order_id or order_number
  const hasOrderId = typeof req.order_id === "string" && req.order_id.length > 0;
  const hasOrderNumber = typeof req.order_number === "string" && req.order_number.length > 0;

  if (!hasOrderId && !hasOrderNumber) {
    return { valid: false, error: "Either order_id or order_number is required" };
  }

  // Validate order_id if provided
  if (hasOrderId && !isValidUUID(req.order_id as string)) {
    return { valid: false, error: "Invalid order_id format" };
  }

  // Validate order_number if provided
  if (hasOrderNumber && (req.order_number as string).length > 50) {
    return { valid: false, error: "order_number exceeds maximum length" };
  }

  return {
    valid: true,
    data: {
      order_id: hasOrderId ? (req.order_id as string) : undefined,
      order_number: hasOrderNumber ? (req.order_number as string) : undefined,
      email: (req.email as string).toLowerCase().trim(),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      throw new Error("Server configuration error");
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validation = validateRequest(requestBody);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { order_id, order_number, email } = validation.data;

    // Use service role to bypass RLS for guest order lookup
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build query - find order by ID or number AND matching email
    // Support both guest orders (user_id IS NULL) and orders with email match
    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        payment_method,
        payment_id,
        tracking_number,
        shipped_at,
        delivered_at,
        created_at,
        shipping_address,
        subtotal,
        tax,
        shipping_cost,
        discount,
        total,
        email,
        user_id
      `);

    if (order_id) {
      query = query.eq("id", order_id);
    } else if (order_number) {
      query = query.eq("order_number", order_number);
    }

    const { data: order, error: orderError } = await query.maybeSingle();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check if order exists
    if (!order) {
      console.log(`Order not found: order_id=${order_id}, order_number=${order_number}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Order not found. Please check your order number." 
        }),
        // Return 200 so client apps don't treat this as an exception.
        // This avoids "Edge function returned 404" runtime overlays in some clients.
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify email matches (check both email column and shipping_address.email)
    const orderEmail = order.email?.toLowerCase();
    const shippingEmail = typeof order.shipping_address === 'object' && order.shipping_address !== null
      ? (order.shipping_address as Record<string, unknown>).email?.toString().toLowerCase()
      : undefined;
    
    const emailMatches = orderEmail === email || shippingEmail === email;
    
    if (!emailMatches) {
      console.log(`Email mismatch for order ${order_number}: stored=${orderEmail || shippingEmail}, provided=${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Order not found. Please check your order number and email address." 
        }),
        // Return 200 to avoid client-side exception overlays.
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_id, product_name, product_image, size, color, quantity, price")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    // Remove sensitive data from response
    const { email: _email, user_id: _userId, ...orderWithoutSensitiveData } = order;

    console.log(`Order retrieved successfully: ${order.order_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        order: orderWithoutSensitiveData,
        items: items || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in get-guest-order:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
