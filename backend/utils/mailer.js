'use strict';

/**
 * Reusable mail utility configured with Gmail SMTP
 * Uses process.env.EMAIL_USER and process.env.EMAIL_APP_PASSWORD (with SMTP_* fallbacks).
 */

const { sendOtpEmail, sendVerificationSuccessEmail } = require('../services/emailService');

module.exports = {
  sendOtpEmail,
  sendVerificationSuccessEmail,
};

