'use strict';

require('dotenv').config();
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

/**
 * Creates a transporter if SMTP credentials are provided.
 */
function getTransporter() {
  if (!nodemailer) return null;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Send 6-digit verification PIN to a PEC email
 */
async function sendOtpEmail(toEmail, otpCode) {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"CampusLend" <no-reply@campuslend.pec.edu.in>';

  const subject = `CampusLend Verification Code: ${otpCode}`;
  const textContent = `Welcome to CampusLend!\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n— The CampusLend Team`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #0284c7; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Campus<span style="color: #0f172a;">Lend</span></h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Peer-to-Peer Marketplace for PEC Students</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; color: #334155; font-size: 15px; font-weight: 600;">Confirm your official PEC email</p>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">Enter this 6-digit security PIN in CampusLend to activate your account:</p>
        
        <div style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
          ${otpCode}
        </div>

        <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 12px;">This code is valid for 10 minutes.</p>
      </div>

      <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">Sent to <strong style="color: #475569;">${toEmail}</strong></p>
        <p style="margin: 4px 0 0 0;">If you did not request this verification, please safely ignore this message.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EmailService] OTP sent to ${toEmail}: ${info.messageId}`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('[EmailService] SMTP error, falling back to console:', err.message);
    }
  }

  // Graceful fallback for local development or when SMTP is not configured
  console.log('\n=============================================================');
  console.log(' [CampusLend Email Service — Development Mode]');
  console.log(` To:      ${toEmail}`);
  console.log(` Subject: ${subject}`);
  console.log(` OTP PIN: >>> ${otpCode} <<<`);
  console.log(' (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for live email)');
  console.log('=============================================================\n');

  return { success: true, mode: 'console', otp: otpCode };
}

module.exports = { sendOtpEmail };
