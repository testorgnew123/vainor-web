import type { Handler } from '@netlify/functions';
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
  logger: true,
  debug: false,
});

interface ContactFormData {
  name: string;
  phone: string;
  remark?: string;
}

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data: ContactFormData = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name is required' }),
      };
    }

    if (!data.phone || !data.phone.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Mobile number is required' }),
      };
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Email HTML template
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
            <h2 style="margin: 0 0 8px; font-size: 20px; color: #333;">New Enquiry Received</h2>
            <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
              Received on ${timestamp}
            </p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 500;">${data.name.trim()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Mobile Number:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 500;">
                    <a href="tel:${data.phone.trim()}" style="color: #000; text-decoration: none;">${data.phone.trim()}</a>
                  </td>
                </tr>
                ${data.remark && data.remark.trim() ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;">Remark:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.remark.trim().replace(/\n/g, '<br>')}</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 16px 24px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              This is an automated notification from your website contact form.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to admin
    console.log(`📧 Sending enquiry notification to admin: ${ADMIN_EMAIL}`);
    
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject: `New Enquiry from ${data.name.trim()} - NUUVELLE`,
      html,
    });

    console.log('✅ Enquiry email sent successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Enquiry sent successfully' }),
    };
  } catch (error) {
    console.error('❌ Error sending enquiry:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send enquiry', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};
