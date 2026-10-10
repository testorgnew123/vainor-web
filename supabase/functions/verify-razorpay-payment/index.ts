import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const MAX_STRING_LENGTH = 200;
const MAX_PRODUCT_NAME_LENGTH = 500;
const MAX_ADDRESS_FIELD_LENGTH = 500;
const MAX_ITEMS = 100;
const MAX_QUANTITY = 1000;
const MAX_AMOUNT = 10000000; // ₹100,000 in paise

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

interface ShippingAddress {
  full_name: string;
  email?: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface OrderData {
  user_id: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  total: number;
  items: OrderItem[];
}

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_data?: OrderData;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

function validateString(value: unknown, maxLength: number, fieldName: string): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} exceeds maximum length of ${maxLength}` };
  }
  return { valid: true };
}

function validateNumber(value: unknown, min: number, max: number, fieldName: string): { valid: boolean; error?: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { valid: true };
}

function validateShippingAddress(address: unknown): { valid: boolean; error?: string } {
  if (!address || typeof address !== "object") {
    return { valid: false, error: "Shipping address is required" };
  }
  
  const addr = address as Record<string, unknown>;
  const requiredFields = ["full_name", "street_address", "city", "state", "postal_code", "country"];
  
  for (const field of requiredFields) {
    const result = validateString(addr[field], MAX_ADDRESS_FIELD_LENGTH, `shipping_address.${field}`);
    if (!result.valid) return result;
    if ((addr[field] as string).trim().length === 0) {
      return { valid: false, error: `shipping_address.${field} cannot be empty` };
    }
  }

  if (addr.phone !== undefined && addr.phone !== null) {
    const phoneResult = validateString(addr.phone, 20, "shipping_address.phone");
    if (!phoneResult.valid) return phoneResult;
  }

  return { valid: true };
}

function validateOrderItem(item: unknown, index: number): { valid: boolean; error?: string } {
  if (!item || typeof item !== "object") {
    return { valid: false, error: `Item ${index} is invalid` };
  }

  const it = item as Record<string, unknown>;

  // Validate product_id (accepts any non-empty string, not just UUID, since app uses static products)
  if (typeof it.product_id !== "string" || it.product_id.trim().length === 0) {
    return { valid: false, error: `Item ${index}: product_id is required` };
  }
  if (it.product_id.length > 100) {
    return { valid: false, error: `Item ${index}: product_id exceeds maximum length` };
  }

  // Validate product_name
  const nameResult = validateString(it.product_name, MAX_PRODUCT_NAME_LENGTH, `Item ${index}: product_name`);
  if (!nameResult.valid) return nameResult;

  // Validate product_image (can be empty string)
  if (it.product_image !== undefined && typeof it.product_image !== "string") {
    return { valid: false, error: `Item ${index}: product_image must be a string` };
  }

  // Validate quantity
  if (!Number.isInteger(it.quantity) || (it.quantity as number) < 1 || (it.quantity as number) > MAX_QUANTITY) {
    return { valid: false, error: `Item ${index}: quantity must be an integer between 1 and ${MAX_QUANTITY}` };
  }

  // Validate price
  const priceResult = validateNumber(it.price, 0, MAX_AMOUNT, `Item ${index}: price`);
  if (!priceResult.valid) return priceResult;

  // Validate size and color
  const sizeResult = validateString(it.size, MAX_STRING_LENGTH, `Item ${index}: size`);
  if (!sizeResult.valid) return sizeResult;

  const colorResult = validateString(it.color, MAX_STRING_LENGTH, `Item ${index}: color`);
  if (!colorResult.valid) return colorResult;

  return { valid: true };
}

function validateOrderData(data: unknown): { valid: boolean; error?: string; data?: OrderData } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Order data is required" };
  }

  const d = data as Record<string, unknown>;

  // Validate user_id (can be null for guest checkout)
  if (d.user_id !== null) {
    if (typeof d.user_id !== "string" || !isValidUUID(d.user_id)) {
      return { valid: false, error: "user_id must be a valid UUID or null" };
    }
  }

  // Validate shipping address
  const addressResult = validateShippingAddress(d.shipping_address);
  if (!addressResult.valid) return addressResult;

  // Validate monetary amounts
  const amountFields = ["subtotal", "shipping_cost", "tax", "discount", "total"];
  for (const field of amountFields) {
    const result = validateNumber(d[field], 0, MAX_AMOUNT, field);
    if (!result.valid) return result;
  }

  // Validate items array
  if (!Array.isArray(d.items)) {
    return { valid: false, error: "items must be an array" };
  }
  if (d.items.length === 0) {
    return { valid: false, error: "Order must have at least one item" };
  }
  if (d.items.length > MAX_ITEMS) {
    return { valid: false, error: `Order cannot have more than ${MAX_ITEMS} items` };
  }

  for (let i = 0; i < d.items.length; i++) {
    const itemResult = validateOrderItem(d.items[i], i);
    if (!itemResult.valid) return itemResult;
  }

  return { valid: true, data: d as unknown as OrderData };
}

function validateVerifyRequest(body: unknown): { valid: boolean; error?: string; data?: VerifyRequest } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate razorpay fields
  const razorpayFields = ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"];
  for (const field of razorpayFields) {
    if (typeof req[field] !== "string" || (req[field] as string).length === 0) {
      return { valid: false, error: `${field} is required` };
    }
    if ((req[field] as string).length > 100) {
      return { valid: false, error: `${field} exceeds maximum length` };
    }
  }

  // Validate order_data if provided
  let orderData: OrderData | undefined;
  if (req.order_data !== undefined) {
    const orderResult = validateOrderData(req.order_data);
    if (!orderResult.valid) {
      return { valid: false, error: orderResult.error };
    }
    orderData = orderResult.data;
  }

  return {
    valid: true,
    data: {
      razorpay_order_id: req.razorpay_order_id as string,
      razorpay_payment_id: req.razorpay_payment_id as string,
      razorpay_signature: req.razorpay_signature as string,
      order_data: orderData,
    },
  };
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authentication check - require auth header but allow guest checkout
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Try to get authenticated user (optional - guest checkout is allowed)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();

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

    const validation = validateVerifyRequest(requestBody);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_data,
    } = validation.data;

    // Verify user_id matches authenticated user (if user is logged in and order has user_id)
    if (order_data?.user_id && user && order_data.user_id !== user.id) {
      console.error("User ID mismatch:", { order_user_id: order_data.user_id, auth_user_id: user.id });
      return new Response(
        JSON.stringify({ success: false, error: "User mismatch" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // For guest checkout (order_data.user_id is null), ensure the authenticated user is also null/guest
    if (order_data?.user_id === null && user) {
      // If a logged-in user is placing order, update user_id to their ID
      order_data.user_id = user.id;
    }

    // Verify payment signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      console.error("Invalid payment signature");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid payment signature",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    // If order_data provided, create order in database
    if (order_data) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Extract email from shipping_address for guest order lookup
      const orderEmail = order_data.shipping_address.email || null;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: order_data.user_id,
          email: orderEmail,
          shipping_address: order_data.shipping_address,
          subtotal: order_data.subtotal,
          shipping_cost: order_data.shipping_cost,
          tax: order_data.tax,
          discount: order_data.discount,
          total: order_data.total,
          payment_id: razorpay_payment_id,
          payment_method: "razorpay",
          payment_status: "paid",
          status: "confirmed",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw new Error("Failed to create order");
      }

      console.log(`Order created: ${order.order_number} with email: ${orderEmail || 'none'}`);


      if (orderError) {
        console.error("Error creating order:", orderError);
        throw new Error("Failed to create order");
      }

      // Create order items
      const orderItems = order_data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          order_id: order.id,
          order_number: order.order_number,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to verify payment",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
