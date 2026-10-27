'use strict';

require('dotenv').config();
const { sendOtpEmail } = require('../services/emailService');

const testRecipient = process.argv[2] || process.env.SMTP_USER;

if (!process.env.SMTP_USER && !process.env.RESEND_API_KEY) {
  console.log('\n❌ No email credentials found in backend/.env.');
  console.log('Please add SMTP_USER and SMTP_PASS (or RESEND_API_KEY) to backend/.env\n');
  process.exit(1);
}

console.log(`\n📧 Testing email delivery to: ${testRecipient}...`);

sendOtpEmail(testRecipient, '789123')
  .then((res) => {
    if (res.success) {
      console.log('✅ SUCCESS: Verification email sent! Check your inbox (or spam folder).\n');
    } else {
      console.error('❌ FAILED: ' + (res.error || 'Unknown error'));
      console.log('Check your email, App Password, and internet connection.\n');
    }
  })
  .catch((err) => {
    console.error('❌ ERROR:', err.message);
  });
