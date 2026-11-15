'use strict';

const { serviceClient } = require('../config/supabaseClient');

/**
 * requireEmailVerified middleware
 *
 * Must be mounted AFTER authMiddleware (expects req.user to be populated).
 * Ensures that the authenticated student has verified their official @pec.edu.in
 * email via OTP before performing sensitive actions (e.g. creating listings or sending borrow requests).
 */
async function requireEmailVerified(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;
  const cleanEmail = (req.user.email || '').toLowerCase().trim();

  try {
    // 1. Check primary verification table: user_otp_verifications
    const { data: otpData, error: otpErr } = await serviceClient
      .from('user_otp_verifications')
      .select('is_email_verified')
      .eq('user_id', userId)
      .maybeSingle();

    if (!otpErr && otpData?.is_email_verified) {
      return next();
    }

    // 2. Fallback check: public.profiles table
    const { data: profileData, error: profErr } = await serviceClient
      .from('profiles')
      .select('is_email_verified')
      .eq('id', userId)
      .maybeSingle();

    if (!profErr && profileData?.is_email_verified) {
      return next();
    }

    // 3. Fallback check: public.email_verifications table
    if (cleanEmail) {
      const { data: emailData, error: emailErr } = await serviceClient
        .from('email_verifications')
        .select('verified')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!emailErr && emailData?.verified) {
        return next();
      }
    }

    // Unverified account: reject with 403 Forbidden and code EMAIL_NOT_VERIFIED
    return res.status(403).json({
      error: 'Official PEC email verification required. Please verify your email with the 6-digit OTP before listing or borrowing items.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  } catch (err) {
    console.error('[requireEmailVerified] Error checking verification status:', err);
    return res.status(500).json({ error: 'Failed to verify account authorization status' });
  }
}

module.exports = requireEmailVerified;
