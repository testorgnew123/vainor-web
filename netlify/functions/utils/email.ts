import * as nodemailer from 'nodemailer';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = (process.env.SMTP_USER || 'order@nuuvelle.com').trim();
const SMTP_HOST = (process.env.SMTP_HOST || 'mail.nuuvelle.com').trim();
const SMTP_PASS = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim().replace(/^["']|["']$/g, '');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || SMTP_USER).trim();
const FROM_ADDRESS = `"NUUVELLE" <${SMTP_USER}>`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  logger: true, // Enable logging
  debug: false, // Set to true for detailed SMTP logs
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    full_name: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  };
}

function formatCurrency(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  // Validate customer email
  if (!data.customerEmail || !data.customerEmail.includes('@')) {
    throw new Error(`Invalid customer email: ${data.customerEmail}`);
  }

  console.log(`📧 Sending order placement notification for ${data.orderNumber} to customer: ${data.customerEmail}, admin: ${ADMIN_EMAIL}`);

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.product_name}<br>
        <small style="color: #666;">Size: ${item.size} | Color: ${item.color}</small>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background-color: #000000; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px;">NUUVELLE</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Order Placed!</h2>
          <p style="color: #666; margin: 0 0 24px;">
            Hi ${data.customerName}, thank you for your order. We've received it and will confirm it shortly.
          </p>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold;">${data.orderNumber}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #666;">Item</th>
                <th style="padding: 12px; text-align: center; font-size: 13px; text-transform: uppercase; color: #666;">Qty</th>
                <th style="padding: 12px; text-align: right; font-size: 13px; text-transform: uppercase; color: #666;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="border-top: 2px solid #000; padding-top: 16px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right;">${formatCurrency(data.subtotal)}</td>
              </tr>
              ${data.discount > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #16a34a;">Discount</td>
                <td style="padding: 4px 0; text-align: right; color: #16a34a;">-${formatCurrency(data.discount)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 4px 0; color: #666;">Shipping</td>
                <td style="padding: 4px 0; text-align: right;">${data.shippingCost === 0 ? 'Free' : formatCurrency(data.shippingCost)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Tax (GST)</td>
                <td style="padding: 4px 0; text-align: right;">${formatCurrency(data.tax)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; border-top: 1px solid #eee;">Total</td>
                <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; text-align: right; border-top: 1px solid #eee;">${formatCurrency(data.total)}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; color: #666;">Shipping Address</h3>
            <p style="margin: 0; line-height: 1.6;">
              ${data.shippingAddress.full_name}<br>
              ${data.shippingAddress.street_address}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postal_code}<br>
              ${data.shippingAddress.country}<br>
              Phone: ${data.shippingAddress.phone}
            </p>
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 24px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">NUUVELLE - Premium Men's Fashion</p>
          <p style="margin: 8px 0 0;">If you have questions, reply to this email or contact us at ${SMTP_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      bcc: ADMIN_EMAIL,
      subject: `Order Placed - ${data.orderNumber} | NUUVELLE`,
      html,
    });
    console.log(`✅ Order placement email sent successfully for ${data.orderNumber}. MessageID: ${info.messageId}`);
    console.log(`   - Customer: ${data.customerEmail}`);
    console.log(`   - Admin (BCC): ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error(`❌ Failed to send order placement email for ${data.orderNumber}:`, error);
    throw error; // Re-throw to let caller handle it
  }
}

export async function sendShippingNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
}): Promise<void> {
  // Validate customer email
  if (!data.customerEmail || !data.customerEmail.includes('@')) {
    throw new Error(`Invalid customer email: ${data.customerEmail}`);
  }

  console.log(`📧 Sending shipping notification for ${data.orderNumber} to: ${data.customerEmail}`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background-color: #000000; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px;">NUUVELLE</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Your Order Has Shipped!</h2>
          <p style="color: #666; margin: 0 0 24px;">
            Hi ${data.customerName}, great news! Your order ${data.orderNumber} is on its way.
          </p>
          ${data.trackingNumber ? `
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Tracking Number</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold;">${data.trackingNumber}</p>
          </div>` : ''}
          <p style="color: #666;">
            You can track your order anytime by visiting your account on our website.
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 24px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">NUUVELLE - Premium Men's Fashion</p>
          <p style="margin: 8px 0 0;">If you have questions, reply to this email or contact us at ${SMTP_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Your Order Has Shipped - ${data.orderNumber} | NUUVELLE`,
      html,
    });
    console.log(`✅ Shipping notification sent successfully for ${data.orderNumber}. MessageID: ${info.messageId}`);
    console.log(`   - Customer: ${data.customerEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send shipping notification for ${data.orderNumber}:`, error);
    throw error; // Re-throw to let caller handle it
  }
}

const STATUS_INFO: Record<string, { title: string; message: string; color: string }> = {
  confirmed: {
    title: 'Order Confirmed',
    message: 'Your order has been confirmed and is being prepared.',
    color: '#2563eb',
  },
  processing: {
    title: 'Order Being Processed',
    message: 'We are currently processing your order. It will be shipped soon.',
    color: '#7c3aed',
  },
  shipped: {
    title: 'Order Shipped',
    message: 'Great news! Your order is on its way.',
    color: '#059669',
  },
  delivered: {
    title: 'Order Delivered',
    message: 'Your order has been delivered. We hope you enjoy your purchase!',
    color: '#16a34a',
  },
  cancelled: {
    title: 'Order Cancelled',
    message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
    color: '#dc2626',
  },
};

export async function sendOrderStatusUpdate(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  trackingNumber?: string;
}): Promise<void> {
  const info = STATUS_INFO[data.status];
  if (!info) {
    console.warn(`⚠️ Unknown order status: ${data.status}. No email sent.`);
    return;
  }

  // Validate customer email
  if (!data.customerEmail || !data.customerEmail.includes('@')) {
    throw new Error(`Invalid customer email: ${data.customerEmail}`);
  }

  console.log(`📧 Sending order status update (${data.status}) for ${data.orderNumber} to: ${data.customerEmail}`);

  const trackingHtml = data.trackingNumber ? `
    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #666;">Tracking Number</p>
      <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold;">${data.trackingNumber}</p>
    </div>` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background-color: #000000; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px;">NUUVELLE</h1>
        </div>
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 8px 20px; background: ${info.color}; color: #fff; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
              ${info.title}
            </div>
          </div>
          <p style="color: #666; margin: 0 0 24px; text-align: center;">
            Hi ${data.customerName}, ${info.message}
          </p>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold;">${data.orderNumber}</p>
          </div>
          ${trackingHtml}
          <p style="color: #666; text-align: center;">
            You can track your order anytime by visiting your account on our website.
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 24px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">NUUVELLE - Premium Men's Fashion</p>
          <p style="margin: 8px 0 0;">If you have questions, reply to this email or contact us at ${SMTP_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const emailInfo = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `${info.title} - ${data.orderNumber} | NUUVELLE`,
      html,
    });
    console.log(`✅ Order status email sent successfully for ${data.orderNumber} (${data.status}). MessageID: ${emailInfo.messageId}`);
    console.log(`   - Customer: ${data.customerEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send order status email for ${data.orderNumber}:`, error);
    throw error; // Re-throw to let caller handle it
  }
}
