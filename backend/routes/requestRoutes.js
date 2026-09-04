'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// All request routes are protected
router.use(authMiddleware);

// Reusable select string — joins equipment name and both profile sides
const REQUEST_SELECT =
  'request_id, equipment_id, borrower_id, owner_id, status, created_at, ' +
  'equipment:equipment_id(equipment_name), ' +
  'borrower:profiles!borrower_id(id, full_name, room_number, phone_number), ' +
  'owner:profiles!owner_id(id, full_name, room_number, phone_number)';

// ── GET /dashboard ────────────────────────────────────────────
// Protected. Returns { borrowed: [...], lending: [...] } for current user.
// NOTE: must be defined before /:request_id to avoid route conflict.
router.get('/dashboard', async (req, res) => {
  const [borrowedResult, lendingResult] = await Promise.all([
    serviceClient
      .from('borrow_requests')
      .select(REQUEST_SELECT)
      .eq('borrower_id', req.user.id)
      .order('created_at', { ascending: false }),
    serviceClient
      .from('borrow_requests')
      .select(REQUEST_SELECT)
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (borrowedResult.error) return res.status(500).json({ error: borrowedResult.error.message });
  if (lendingResult.error) return res.status(500).json({ error: lendingResult.error.message });

  res.json({
    borrowed: borrowedResult.data,
    lending: lendingResult.data,
  });
});

// ── POST / ────────────────────────────────────────────────────
// Protected. Creates a borrow request.
// Enforces: borrower_id = req.user.id, borrower ≠ owner, equipment must be available.
router.post('/', async (req, res) => {
  const { equipment_id, owner_id } = req.body;

  if (!equipment_id || !owner_id) {
    return res.status(400).json({ error: 'equipment_id and owner_id are required' });
  }

  // Prevent self-borrowing
  if (owner_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot borrow your own item' });
  }

  // Verify equipment exists and is available
  const { data: equipment, error: eqError } = await serviceClient
    .from('equipment')
    .select('equipment_id, status, owner_id')
    .eq('equipment_id', equipment_id)
    .single();

  if (eqError || !equipment) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  if (equipment.status !== 'available') {
    return res.status(409).json({ error: 'Equipment is not currently available' });
  }

  const { data, error } = await serviceClient
    .from('borrow_requests')
    .insert({
      equipment_id,
      borrower_id: req.user.id,   // always the authenticated user — never trust the body
      owner_id,
      status: 'pending',
    })
    .select(REQUEST_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── PUT /:request_id ──────────────────────────────────────────
// Protected. Owner-only: approve or reject a borrow request.
// On approval, also updates equipment.status → 'borrowed'.
router.put('/:request_id', async (req, res) => {
  const { request_id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
  }

  // Fetch request to verify ownership
  const { data: request, error: fetchError } = await serviceClient
    .from('borrow_requests')
    .select('request_id, owner_id, equipment_id, status')
    .eq('request_id', request_id)
    .single();

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Borrow request not found' });
  }
  if (request.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: you are not the owner of this item' });
  }

  // Update request status
  const { data, error } = await serviceClient
    .from('borrow_requests')
    .update({ status })
    .eq('request_id', request_id)
    .select(REQUEST_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // If approved, mark the equipment as borrowed
  if (status === 'approved') {
    const { error: eqError } = await serviceClient
      .from('equipment')
      .update({ status: 'borrowed' })
      .eq('equipment_id', request.equipment_id);

    if (eqError) {
      // Request was updated; warn but still return success so the client is consistent
      console.error('Failed to update equipment status after approval:', eqError.message);
    }
  }

  res.json(data);
});

module.exports = router;
