'use strict';

const { anonClient } = require('../config/supabaseClient');

/**
 * authMiddleware
 *
 * Flow:
 * 1. Read Authorization header.
 * 2. Expect "Bearer <token>" — 401 if missing or malformed.
 * 3. Verify JWT via anonClient.auth.getUser(token) — validates
 *    the signature against the Supabase project secret server-side.
 * 4. Attach the verified user to req.user and call next().
 *
 * req.user.id  — the caller's UUID (FK to auth.users / profiles.id)
 * req.user.email — available for logging if needed
 *
 * Does NOT query public.profiles — identity comes from auth.users via JWT only.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed authorization header. Expected: Bearer <token>' });
  }

  const token = parts[1];

  const { data, error } = await anonClient.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}

module.exports = authMiddleware;
