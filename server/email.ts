import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;

export function getEmailTransporter(): nodemailer.Transporter | null {
  // Return existing transporter if already created
  if (transporter) {
    return transporter;
  }

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log('[Email] Checking SMTP configuration...');
  console.log('[Email] SMTP_HOST:', smtpHost ? '✓ Set' : '✗ Missing');
  console.log('[Email] SMTP_PORT:', smtpPort ? `✓ Set (${smtpPort})` : '✗ Missing');
  console.log('[Email] SMTP_USER:', smtpUser ? '✓ Set' : '✗ Missing');
  console.log('[Email] SMTP_PASS:', smtpPass ? '✓ Set' : '✗ Missing');

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('[Email] ⚠️ SMTP not fully configured. Emails will not be sent.');
    console.warn('[Email] Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file.');
    console.warn('[Email] Verification codes will be logged to console instead.');
    return null;
  }

  try {
    const port = parseInt(smtpPort, 10);
    const isSecure = port === 465; // Port 465 uses SSL, port 587 uses TLS
    
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: isSecure, // true for 465, false for other ports (587 uses STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // For Gmail with App Password, you can also use:
      // service: 'gmail',
      // auth: {
      //   user: smtpUser,
      //   pass: smtpPass, // Use App Password for Gmail
      // },
    });

    console.log('[Email] ✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('[Email] ❌ Error creating email transporter:', error);
    return null;
  }
}

// Option 1: Use Resend API (Free tier: 100 emails/day, 3,000/month)
async function sendViaResend(email: string, code: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return false;
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  const fromEmail = process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';
  const appName = 'SaveToGather';

  const htmlTemplate = getEmailTemplate(code, appName);

  try {
    const { data, error } = await resendClient.emails.send({
      from: `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `Verify Your Email - ${appName}`,
      html: htmlTemplate,
    });

    if (error) {
      console.error('[Email] ❌ Resend error:', error);
      return false;
    }

    console.log('[Email] ✅ Verification email sent via Resend');
    console.log('[Email] Message ID:', data?.id);
    return true;
  } catch (error: any) {
    console.error('[Email] ❌ Error sending via Resend:', error);
    return false;
  }
}

// Option 2: Use Ethereal Email (Instant fake SMTP for development - no setup needed!)
async function sendViaEthereal(email: string, code: string): Promise<boolean> {
  try {
    // Create a test account (instant, no signup needed)
    const testAccount = await nodemailer.createTestAccount();
    console.log('[Email] 📧 Ethereal test account created');
    console.log('[Email] 📧 View emails at: https://ethereal.email');
    console.log('[Email] 📧 Test account:', testAccount.user);
    console.log('[Email] 📧 Test password:', testAccount.pass);

    const etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const fromEmail = process.env.SMTP_FROM || 'noreply@savetogather.com';
    const appName = 'SaveToGather';
    const htmlTemplate = getEmailTemplate(code, appName);
    const textTemplate = getTextTemplate(code, appName);

    const info = await etherealTransporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `Verify Your Email - ${appName}`,
      text: textTemplate,
      html: htmlTemplate,
    });

    // Get the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('[Email] ✅ Verification email sent via Ethereal');
    console.log('[Email] 📧 Preview URL:', previewUrl);
    console.log('[Email] ⚠️ This is a test email - check the preview URL to see it!');
    
    return true;
  } catch (error: any) {
    console.error('[Email] ❌ Error sending via Ethereal:', error);
    return false;
  }
}

// Helper function to get email template
function getEmailTemplate(code: string, appName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${appName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 20px; background-color: #ffffff;">
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto;">
              <tr>
                <td>
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Verify Your Email Address</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for signing up! Please verify your email address by entering the verification code below.
                  </p>
                  <div style="background-color: #f8f9fa; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Verification Code</p>
                    <p style="color: #3b82f6; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                      ${code}
                    </p>
                  </div>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    <strong>Important:</strong> This code will expire in <strong>15 minutes</strong>. If you didn't request this code, please ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f8f9fa;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ${appName}. All rights reserved.
            </p>
            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
              This is an automated email, please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function getTextTemplate(code: string, appName: string): string {
  return `
Verify Your Email Address

Thank you for signing up! Please verify your email address by entering the verification code below.

Your Verification Code: ${code}

Important: This code will expire in 15 minutes. If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
  `;
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // Priority 1: Try Resend (if API key is set)
  if (process.env.RESEND_API_KEY) {
    console.log('[Email] Attempting to send via Resend...');
    const sent = await sendViaResend(email, code);
    if (sent) return true;
  }

  // Priority 2: Try Ethereal (for development - instant, no setup)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('[Email] Attempting to send via Ethereal (development mode)...');
    const sent = await sendViaEthereal(email, code);
    if (sent) return true;
  }

  // Priority 3: Try SMTP (if configured)
  const emailTransporter = getEmailTransporter();
  
  if (emailTransporter) {
    console.log('[Email] Attempting to send via SMTP...');
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@savetogather.com';
    const appName = 'SaveToGather';
    const htmlTemplate = getEmailTemplate(code, appName);
    const textTemplate = getTextTemplate(code, appName);

    try {
      const info = await emailTransporter.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to: email,
        subject: `Verify Your Email - ${appName}`,
        text: textTemplate,
        html: htmlTemplate,
      });

      console.log('[Email] ✅ Verification email sent successfully via SMTP');
      console.log('[Email] Message ID:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('[Email] ❌ Error sending via SMTP:', error);
    }
  }

  // Fallback: Log to console
  console.warn('[Email] ⚠️ No email service configured. Verification code logged below:');
  console.log(`[Email] 📧 ==========================================`);
  console.log(`[Email] 📧 VERIFICATION CODE FOR ${email}`);
  console.log(`[Email] 📧 CODE: ${code}`);
  console.log(`[Email] 📧 This code expires in 15 minutes`);
  console.log(`[Email] 📧 ==========================================`);
  return false;
}

// Verify transporter connection (optional, for testing)
export async function verifyEmailConnection(): Promise<boolean> {
  const emailTransporter = getEmailTransporter();
  
  if (!emailTransporter) {
    return false;
  }

  try {
    await emailTransporter.verify();
    console.log('[Email] ✅ SMTP connection verified');
    return true;
  } catch (error: any) {
    console.error('[Email] ❌ SMTP connection failed:', error);
    return false;
  }
}

