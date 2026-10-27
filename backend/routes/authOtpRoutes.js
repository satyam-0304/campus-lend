'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { serviceClient } = require('../config/supabaseClient');
const { sendOtpEmail } = require('../services/emailService');

/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit verification PIN to an official @pec.edu.in email.
 */
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail.endsWith('@pec.edu.in')) {
    return res.status(400).json({ error: 'Email must be an official @pec.edu.in address' });
  }

  // Generate a random secure 6-digit numeric PIN
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

  try {
    // Upsert into email_verifications table
    const { error: dbError } = await serviceClient
      .from('email_verifications')
      .upsert(
        {
          email: cleanEmail,
          otp_code: otpCode,
          expires_at: expiresAt,
          verified: false,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('[authOtpRoutes] Upsert error:', dbError.message);
      // Even if table doesn't exist yet, we still proceed to send email in dev mode
    }

    const emailResult = await sendOtpEmail(cleanEmail, otpCode);

    if (!emailResult.success) {
      return res.status(503).json({
        error: emailResult.error || 'Failed to send verification email. Please check server email setup.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your PEC email',
    });
  } catch (err) {
    console.error('[authOtpRoutes] Error sending OTP:', err);
    return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Validates the 6-digit PIN against stored record.
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  try {
    const { data, error } = await serviceClient
      .from('email_verifications')
      .select('otp_code, expires_at, verified')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'No verification request found for this email. Please request a new code.' });
    }

    if (new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (data.otp_code !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and re-enter.' });
    }

    // Mark verified
    await serviceClient
      .from('email_verifications')
      .update({ verified: true })
      .eq('email', cleanEmail);

    return res.json({
      success: true,
      verified: true,
      message: 'PEC email verified successfully',
    });
  } catch (err) {
    console.error('[authOtpRoutes] Verification error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;
