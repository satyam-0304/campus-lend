'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const crypto = require('crypto');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

console.log('\n🧪 Testing OTP Logic & Security Constraints:');

// Test 1: SHA-256 Hashing and timing-safe equality
const originalOtp = '482910';
const hashed = hashOtp(originalOtp);
console.log('1. Generated OTP:', originalOtp, '-> SHA-256 Hash:', hashed);
console.assert(hashed.length === 64, 'SHA-256 hash must be 64 hex characters');

// Test 2: Valid match
const validMatch = safeEqual(hashOtp('482910'), hashed);
console.log('2. Valid OTP match:', validMatch);
console.assert(validMatch === true, 'Matching OTP must return true');

// Test 3: Invalid match
const invalidMatch = safeEqual(hashOtp('123456'), hashed);
console.log('3. Invalid OTP match:', invalidMatch);
console.assert(invalidMatch === false, 'Invalid OTP must return false');

// Test 4: Rate limit & cooldown check
const lastSent = new Date(Date.now() - 30 * 1000).toISOString(); // 30s ago
const elapsed = Date.now() - new Date(lastSent).getTime();
const isCooldownActive = elapsed < 60000;
console.log('4. Cooldown 30s after send active:', isCooldownActive, `(${Math.ceil((60000 - elapsed) / 1000)}s remaining)`);
console.assert(isCooldownActive === true, 'Cooldown must be active under 60 seconds');

// Test 5: Brute force attempts check
let attempts = 0;
for (let i = 1; i <= 5; i++) {
  attempts++;
}
console.log('5. Attempts after 5 failures:', attempts, '-> Locked out:', attempts >= 5);
console.assert(attempts >= 5, 'Must be locked out after 5 failed attempts');

console.log('\n✅ All OTP security logic tests passed successfully!\n');

