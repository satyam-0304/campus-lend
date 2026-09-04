'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// All profile routes are protected
router.use(authMiddleware);

// Profile columns that are safe to select and return.
// CRITICAL: email is NOT a column on public.profiles — never query it here.
const PROFILE_SELECT = 'id, full_name, room_number, phone_number';

// ── GET /me ───────────────────────────────────────────────────
// Protected. Fetches the authenticated user's profile row.
router.get('/me', async (req, res) => {
  const { data, error } = await serviceClient
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', req.user.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(data);
});

// ── PUT /me ───────────────────────────────────────────────────
// Protected. Updates editable profile fields for the authenticated user.
// Only updates fields that are explicitly provided in the request body.
// CRITICAL: email is never updated here — it lives in auth.users only.
// NOTE: No POST route — the Supabase trigger (handle_new_user) auto-creates
//       the profile row when a user signs up via auth.users.
router.put('/me', async (req, res) => {
  const { full_name, room_number, phone_number } = req.body;

  // Build a partial update — only include fields the caller sent
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (room_number !== undefined) updates.room_number = room_number;
  if (phone_number !== undefined) updates.phone_number = phone_number;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'Provide at least one of: full_name, room_number, phone_number',
    });
  }

  const { data, error } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select(PROFILE_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
