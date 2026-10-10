import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MIN_AMOUNT = 100; // Minimum ₹1 (100 paise)
const MAX_AMOUNT = 10000000; // Maximum ₹100,000 (10000000 paise)
const VALID_CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const MAX_NOTE_KEY_LENGTH = 50;
const MAX_NOTE_VALUE_LENGTH = 200;
const MAX_NOTES_COUNT = 10;

interface OrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

function validateOrderRequest(body: unknown): { valid: boolean; error?: string; data?: OrderRequest } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate amount
  if (typeof req.amount !== "number" || !Number.isFinite(req.amount)) {
    return { valid: false, error: "Amount must be a valid number" };
  }
  if (req.amount < MIN_AMOUNT) {
    return { valid: false, error: `Amount must be at least ${MIN_AMOUNT} paise (₹1)` };
  }
  if (req.amount > MAX_AMOUNT) {
    return { valid: false, error: `Amount cannot exceed ${MAX_AMOUNT} paise (₹100,000)` };
  }
  if (!Number.isInteger(req.amount)) {
    return { valid: false, error: "Amount must be an integer (paise)" };
  }

  // Validate currency
  const currency = req.currency ?? "INR";
  if (typeof currency !== "string" || !VALID_CURRENCIES.includes(currency)) {
    return { valid: false, error: `Currency must be one of: ${VALID_CURRENCIES.join(", ")}` };
  }

  // Validate receipt
  let receipt: string | undefined;
  if (req.receipt !== undefined) {
    if (typeof req.receipt !== "string" || req.receipt.length > 40) {
      return { valid: false, error: "Receipt must be a string with max 40 characters" };
    }
    receipt = req.receipt;
  }

  // Validate notes
  let notes: Record<string, string> | undefined;
  if (req.notes !== undefined) {
    if (typeof req.notes !== "object" || req.notes === null || Array.isArray(req.notes)) {
      return { valid: false, error: "Notes must be an object" };
    }
    const noteEntries = Object.entries(req.notes);
    if (noteEntries.length > MAX_NOTES_COUNT) {
      return { valid: false, error: `Notes cannot have more than ${MAX_NOTES_COUNT} entries` };
    }
    for (const [key, value] of noteEntries) {
      if (typeof key !== "string" || key.length > MAX_NOTE_KEY_LENGTH) {
        return { valid: false, error: `Note key must be a string with max ${MAX_NOTE_KEY_LENGTH} characters` };
      }
      if (typeof value !== "string" || value.length > MAX_NOTE_VALUE_LENGTH) {
        return { valid: false, error: `Note value must be a string with max ${MAX_NOTE_VALUE_LENGTH} characters` };
      }
    }
    notes = req.notes as Record<string, string>;
  }

  return {
    valid: true,
    data: {
      amount: req.amount as number,
      currency: currency as string,
      receipt,
      notes,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get Supabase credentials
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Try to get authenticated user (optional - guest checkout is allowed)
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Log whether this is an authenticated user or guest checkout
    console.log("Processing order request for:", user?.id || "guest");

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
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

    const validation = validateOrderRequest(requestBody);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { amount, currency, receipt, notes } = validation.data;

    // Create Razorpay order
    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay API error:", errorData);
      throw new Error(`Failed to create Razorpay order: ${orderResponse.status}`);
    }

    const order = await orderResponse.json();
    console.log("Razorpay order created:", order.id, "for user:", user?.id || "guest");

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        key_id: RAZORPAY_KEY_ID,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create order",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
