import { Handler } from '@netlify/functions';
import * as nodemailer from 'nodemailer';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = (process.env.SMTP_USER || 'order@vainor.com').trim();
const SMTP_HOST = (process.env.SMTP_HOST || 'mail.vainor.com').trim();
const SMTP_PASS = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim().replace(/^["']|["']$/g, '');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || SMTP_USER).trim();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { to } = JSON.parse(event.body || '{}');

    if (!to || !to.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address required in "to" field' }),
      };
    }

    console.log('🔧 Testing email configuration...');
    console.log(`   SMTP Host: ${SMTP_HOST}`);
    console.log(`   SMTP Port: ${SMTP_PORT}`);
    console.log(`   SMTP User: ${SMTP_USER}`);
    console.log(`   Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   Test recipient: ${to}`);

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    const info = await transporter.sendMail({
      from: `"VAINOR Test" <${SMTP_USER}>`,
      to: to,
      bcc: ADMIN_EMAIL,
      subject: 'Test Email from VAINOR',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #181A20;">Email Test Successful!</h2>
          <p>This is a test email from your VAINOR e-commerce system.</p>
          <p>If you're seeing this, your email configuration is working correctly.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            <strong>Configuration Details:</strong><br>
            SMTP Host: ${SMTP_HOST}<br>
            SMTP Port: ${SMTP_PORT}<br>
            From: ${SMTP_USER}<br>
            Admin (BCC): ${ADMIN_EMAIL}<br>
            Test Time: ${new Date().toISOString()}
          </p>
        </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        recipient: to,
        adminCopy: ADMIN_EMAIL,
        smtpConfig: {
          host: SMTP_HOST,
          port: SMTP_PORT,
          user: SMTP_USER,
        },
      }),
    };
  } catch (error: any) {
    console.error('❌ Email test failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send test email',
        details: {
          message: error.message,
          code: error.code,
          command: error.command,
        },
        smtpConfig: {
          host: SMTP_HOST,
          port: SMTP_PORT,
          user: SMTP_USER,
        },
      }),
    };
  }
};
