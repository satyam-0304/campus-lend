'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// All profile routes are protected
router.use(authMiddleware);

// Profile columns that are safe to select and return.
// CRITICAL: email is NOT a column on public.profiles — never query it here.
const PROFILE_SELECT =
  'id, full_name, room_number, phone_number, student_id, degree, batch_year, branch, residence_type, hostel_name, address';

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
  const {
    full_name,
    room_number,
    phone_number,
    student_id,
    degree,
    batch_year,
    branch,
    residence_type,
    hostel_name,
    address,
  } = req.body;

  // Validate student_id (SID) if provided: must be exactly 8 digits
  if (student_id !== undefined && student_id !== null && student_id !== '') {
    const cleanSid = String(student_id).trim();
    if (!/^\d{8}$/.test(cleanSid)) {
      return res.status(400).json({ error: 'Student ID (SID) must be exactly 8 digits' });
    }
  }

  // Validate residence_type if provided
  if (residence_type !== undefined && residence_type !== null && residence_type !== '') {
    if (!['hosteller', 'day_scholar'].includes(residence_type)) {
      return res.status(400).json({ error: "Residence type must be 'hosteller' or 'day_scholar'" });
    }
  }

  // Build a partial update — only include fields the caller sent
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name.trim();
  if (room_number !== undefined) updates.room_number = room_number.trim();
  if (phone_number !== undefined) updates.phone_number = phone_number.trim();
  if (student_id !== undefined) updates.student_id = student_id.trim();
  if (degree !== undefined) updates.degree = degree.trim();
  if (batch_year !== undefined) updates.batch_year = String(batch_year).trim();
  if (branch !== undefined) updates.branch = branch.trim();
  if (residence_type !== undefined) updates.residence_type = residence_type;
  if (hostel_name !== undefined) updates.hostel_name = hostel_name.trim();
  if (address !== undefined) updates.address = address.trim();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'Provide at least one profile field to update',
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
