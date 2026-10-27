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
 * Send via Resend REST API if RESEND_API_KEY is configured
 */
async function sendViaResend(toEmail, otpCode, htmlContent, textContent) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const fromAddress = process.env.EMAIL_FROM || 'CampusLend <onboarding@resend.dev>';
  const subject = `CampusLend Verification Code: ${otpCode}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toEmail],
      subject,
      html: htmlContent,
      text: textContent,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Resend API error status ${response.status}`);
  }
  console.log(`[EmailService] OTP sent to ${toEmail} via Resend (${data?.id})`);
  return { success: true, mode: 'resend', id: data?.id };
}

/**
 * Send 6-digit verification PIN to a PEC email
 */
async function sendOtpEmail(toEmail, otpCode) {
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

  // 1. Try Resend if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend(toEmail, otpCode, htmlContent, textContent);
    } catch (err) {
      console.error('[EmailService] Resend failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Try SMTP if credentials are configured
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EmailService] OTP sent to ${toEmail} via SMTP: ${info.messageId}`);
      return { success: true, mode: 'smtp', id: info.messageId };
    } catch (err) {
      console.error('[EmailService] SMTP error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 3. Neither is configured
  console.error('\n[EmailService] CRITICAL: No email provider configured!');
  console.error('Please configure either RESEND_API_KEY or (SMTP_HOST, SMTP_USER, SMTP_PASS) in backend/.env to deliver OTPs to students.');
  console.log(`[EmailService Dev Debug Log] Target: ${toEmail} | Code: ${otpCode}\n`);

  return {
    success: false,
    error: 'Email delivery service is not configured on the server. Please configure SMTP or Resend credentials.',
  };
}

module.exports = { sendOtpEmail };
