import { Handler } from '@netlify/functions';
import { query } from './utils/db';
import { sendOrderConfirmation } from './utils/email';
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
    const orderNumber = `VNR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Extract customer email from shipping address for guest order linking
    const customerEmail = order_data.shipping_address?.email || null;

    // Create order in database
    const orderResult = await query(
      `INSERT INTO orders (
        order_number, user_id, email, status, subtotal, tax, shipping_cost, discount, total,
        shipping_address, billing_address, payment_method, payment_status, payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        orderNumber,
        order_data.user_id || null,
        customerEmail,
        'pending',
        order_data.subtotal,
        order_data.tax,
        order_data.shipping_cost,
        order_data.discount || 0,
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
          String(item.product_id),
          item.product_name,
          item.product_image,
          item.quantity,
          item.size,
          item.color,
          item.price,
        ]
      );
    }

    // Stock deduction for database products
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of order_data.items) {
      const productId = String(item.product_id);

      if (UUID_REGEX.test(productId)) {
        try {
          const stockResult = await query(
            `UPDATE products
             SET stock_quantity = stock_quantity - $1
             WHERE id = $2 AND stock_quantity >= $1
             RETURNING stock_quantity`,
            [item.quantity, productId]
          );

          if (stockResult.rows.length > 0) {
            const newQty = stockResult.rows[0].stock_quantity;
            const prevQty = newQty + item.quantity;
            await query(
              `INSERT INTO inventory_log (product_id, change_type, quantity_change, previous_quantity, new_quantity, notes)
               VALUES ($1, 'sale', $2, $3, $4, $5)`,
              [productId, -item.quantity, prevQty, newQty, `Order ${orderNumber} - ${item.product_name}`]
            );
          } else {
            console.warn(`Insufficient stock for product ${productId}. Order ${orderNumber} may be oversold.`);
          }
        } catch (stockError) {
          console.error(`Stock deduction failed for product ${productId}:`, stockError);
        }
      }
    }

    // Increment coupon usage if a coupon was applied
    if (order_data.coupon_code) {
      try {
        await query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE code = $1',
          [order_data.coupon_code]
        );
      } catch (couponError) {
        console.error('Coupon usage increment failed:', couponError);
      }
    }

    // Send order placement email (non-fatal)
    let emailSent = false;
    try {
      const shippingAddr = order_data.shipping_address;

      // Validate email before attempting to send
      if (!shippingAddr.email || !shippingAddr.email.includes('@')) {
        console.error(`❌ Invalid customer email for order ${orderNumber}: ${shippingAddr.email}`);
      } else {
        await sendOrderConfirmation({
          orderNumber,
          customerName: shippingAddr.full_name,
          customerEmail: shippingAddr.email,
          items: order_data.items.map((item: any) => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            size: item.size || '',
            color: item.color || '',
          })),
          subtotal: order_data.subtotal,
          discount: order_data.discount || 0,
          shippingCost: order_data.shipping_cost,
          tax: order_data.tax,
          total: order_data.total,
          shippingAddress: {
            full_name: shippingAddr.full_name,
            street_address: shippingAddr.street_address,
            city: shippingAddr.city,
            state: shippingAddr.state,
            postal_code: shippingAddr.postal_code,
            country: shippingAddr.country || 'India',
            phone: shippingAddr.phone,
          },
        });
        emailSent = true;
      }
    } catch (emailError: any) {
      console.error(`❌ Failed to send order placement email for ${orderNumber}:`, emailError);
      console.error('   Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
      });
    }

    if (!emailSent) {
      console.warn(`⚠️ Order ${orderNumber} completed but customer email was NOT sent!`);
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