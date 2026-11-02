'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { serviceClient } = require('../config/supabaseClient');
const { sendOtpEmail, sendVerificationSuccessEmail } = require('../services/emailService');
const authMiddleware = require('../middleware/authMiddleware');

// Fallback in-memory store if DB table user_otp_verifications is pending migration
const memoryOtpStore = new Map();

/**
 * Helper to compute SHA-256 hash of plain text
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Helper for timing-safe string comparison
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED LOGGED-IN USER OTP ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/otp/status
 * Check if the currently logged-in user is email-verified
 */
router.get('/otp/status', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const email = (req.user.email || '').toLowerCase().trim();

  try {
    const { data, error } = await serviceClient
      .from('user_otp_verifications')
      .select('is_email_verified, otp_last_sent_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet, check memory store
      const mem = memoryOtpStore.get(userId);
      return res.json({
        isEmailVerified: mem?.isEmailVerified ?? false,
        email,
      });
    }

    const isEmailVerified = Boolean(data?.is_email_verified);
    let cooldownRemaining = 0;
    if (data?.otp_last_sent_at) {
      const elapsed = Date.now() - new Date(data.otp_last_sent_at).getTime();
      if (elapsed < 60000) {
        cooldownRemaining = Math.ceil((60000 - elapsed) / 1000);
      }
    }

    return res.json({
      isEmailVerified,
      email,
      cooldownRemaining,
    });
  } catch (err) {
    console.error('[authOtpRoutes] Status check error:', err);
    return res.json({ isEmailVerified: false, email });
  }
});

/**
 * POST /api/auth/otp/send
 * Generate and dispatch a 6-digit SHA-256 hashed OTP to the logged-in user's email
 */
router.post('/otp/send', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const cleanEmail = (req.user.email || '').toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.endsWith('@pec.edu.in')) {
    return res.status(403).json({ error: 'Access restricted: Only official @pec.edu.in accounts can verify.' });
  }

  try {
    // 1. Fetch existing verification record
    let existing = null;
    let tableExists = true;

    const { data: dbData, error: fetchError } = await serviceClient
      .from('user_otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      tableExists = false;
      existing = memoryOtpStore.get(userId);
    } else {
      existing = dbData;
    }

    // 2. Enforce 20-second cooldown using otp_last_sent_at
    const lastSent = existing?.otp_last_sent_at || existing?.otpLastSentAt;
    if (lastSent) {
      const elapsed = Date.now() - new Date(lastSent).getTime();
      const COOLDOWN_MS = 20 * 1000;
      if (elapsed < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `Please wait ${remainingSeconds}s before requesting a new verification code.`,
          retryAfterSeconds: remainingSeconds,
        });
      }
    }

    // 4. Generate cryptographically secure 6-digit OTP
    const plainOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(plainOtp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const nowIso = new Date().toISOString();

    // 5. Save to database (or fallback memory store)
    const verificationRecord = {
      user_id: userId,
      email: cleanEmail,
      is_email_verified: false,
      otp_hash: otpHash,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0,
      otp_last_sent_at: nowIso,
      updated_at: nowIso,
    };

    if (tableExists) {
      const { error: upsertError } = await serviceClient
        .from('user_otp_verifications')
        .upsert(verificationRecord, { onConflict: 'user_id' });

      if (upsertError) {
        console.warn('[authOtpRoutes] DB Upsert error, saving to memory fallback:', upsertError.message);
        memoryOtpStore.set(userId, verificationRecord);
      }
    } else {
      memoryOtpStore.set(userId, verificationRecord);
    }

    // 6. Send the plain-text OTP via Nodemailer utility
    const emailResult = await sendOtpEmail(cleanEmail, plainOtp);

    if (!emailResult.success) {
      console.warn(`[authOtpRoutes Dev Warning] Outbound email failed: ${emailResult.error}`);
      console.log(`[authOtpRoutes Dev Fallback] OTP for ${cleanEmail}: ${plainOtp}`);

      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return res.json({
          success: true,
          message: 'Verification code generated (email service offline, code logged to terminal in dev mode)',
          devOtp: plainOtp,
          cooldownSeconds: 60,
        });
      }

      return res.status(503).json({
        error: emailResult.error || 'Failed to dispatch verification email. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      cooldownSeconds: 60,
    });
  } catch (err) {
    console.error('[authOtpRoutes] Error in /otp/send:', err);
    return res.status(500).json({ error: 'Internal server error while sending verification code.' });
  }
});

/**
 * POST /api/auth/otp/verify
 * Validate 6-digit PIN against SHA-256 hash with brute-force rate-limiting
 */
router.post('/otp/verify', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { otp } = req.body;

  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit numeric verification code.' });
  }

  const cleanOtp = otp.trim();

  try {
    let record = null;
    let tableExists = true;

    const { data: dbData, error: fetchError } = await serviceClient
      .from('user_otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !dbData) {
      record = memoryOtpStore.get(userId);
      if (!dbData) tableExists = false;
    } else {
      record = dbData;
    }

    if (!record || !record.otp_hash) {
      return res.status(400).json({
        error: 'No active verification code found for this account. Please request a new code.',
      });
    }

    if (record.is_email_verified) {
      return res.json({
        success: true,
        isEmailVerified: true,
        message: 'Your email is already verified.',
      });
    }

    // 1. Check brute force attempts (>= 5)
    const attempts = record.otp_attempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        error: 'Too many failed attempts (5/5). For security, please request a new verification code.',
        requireNewOtp: true,
      });
    }

    // 2. Check expiration (10 minutes)
    if (new Date() > new Date(record.otp_expires_at)) {
      return res.status(400).json({
        error: 'Verification code has expired (valid for 10 minutes). Please request a new code.',
        expired: true,
      });
    }

    // 3. Timing-safe comparison of SHA-256 hash
    const submittedHash = hashOtp(cleanOtp);
    const isMatch = safeEqual(submittedHash, record.otp_hash);

    if (!isMatch) {
      const newAttempts = attempts + 1;
      const remaining = Math.max(0, 5 - newAttempts);

      if (tableExists) {
        await serviceClient
          .from('user_otp_verifications')
          .update({
            otp_attempts: newAttempts,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
      if (record) {
        record.otp_attempts = newAttempts;
        memoryOtpStore.set(userId, record);
      }

      return res.status(400).json({
        error: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. For security, please request a new verification code.',
        attemptsRemaining: remaining,
      });
    }

    // 4. On match: set is_email_verified = true, clear hash/expires, reset attempts
    const updatePayload = {
      is_email_verified: true,
      otp_hash: null,
      otp_expires_at: null,
      otp_attempts: 0,
      updated_at: new Date().toISOString(),
    };

    if (tableExists) {
      await serviceClient
        .from('user_otp_verifications')
        .update(updatePayload)
        .eq('user_id', userId);
    }
    memoryOtpStore.set(userId, {
      ...record,
      ...updatePayload,
    });

    // Also update email_verifications table for global compatibility
    try {
      const cleanEmail = (req.user?.email || '').toLowerCase().trim();
      await serviceClient
        .from('email_verifications')
        .upsert({
          email: cleanEmail,
          otp_code: '000000',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          verified: true,
          created_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    } catch {}

    // Send confirmation email
    const cleanUserEmail = (req.user?.email || '').toLowerCase().trim();
    const recipientName = req.user?.user_metadata?.full_name || 'PEC Student';
    sendVerificationSuccessEmail(cleanUserEmail, recipientName).catch((err) => {
      console.warn('[authOtpRoutes] Error sending confirmation email:', err.message);
    });

    return res.json({
      success: true,
      isEmailVerified: true,
      message: 'PEC email verified successfully! 🎉',
    });
  } catch (err) {
    console.error('[authOtpRoutes] Error in /otp/verify:', err);
    return res.status(500).json({ error: 'Internal server error while verifying code.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE PUBLIC ROUTES (FOR PRE-LOGIN SIGNUP FLOW)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail.endsWith('@pec.edu.in')) {
    return res.status(400).json({ error: 'Email must be an official @pec.edu.in address' });
  }

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    await serviceClient
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
      )
      .catch(() => {});

    const emailResult = await sendOtpEmail(cleanEmail, otpCode);

    if (!emailResult.success) {
      console.warn(`[authOtpRoutes Dev Warning] Outbound email failed: ${emailResult.error}`);
      console.log(`[authOtpRoutes Dev Fallback] OTP for ${cleanEmail}: ${otpCode}`);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: 'Email service notice: OTP logged to server terminal (dev mode)',
          devOtp: otpCode,
        });
      }
      return res.status(503).json({
        error: emailResult.error || 'Failed to send verification email. Please check server email setup.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your PEC email',
    });
  } catch (err) {
    console.error('[authOtpRoutes] Error in /send-otp:', err);
    return res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

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

    await serviceClient
      .from('email_verifications')
      .update({ verified: true })
      .eq('email', cleanEmail);

    sendVerificationSuccessEmail(cleanEmail, 'PEC Student').catch(() => {});

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
