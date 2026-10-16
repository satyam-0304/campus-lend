'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// All request routes are protected
router.use(authMiddleware);

// Reusable select string — joins equipment name and both profile sides
const REQUEST_SELECT =
  'request_id, equipment_id, borrower_id, owner_id, status, created_at, requested_quantity, ' +
  'equipment:equipment_id(equipment_name), ' +
  'borrower:profiles!borrower_id(id, full_name, room_number, phone_number), ' +
  'owner:profiles!owner_id(id, full_name, room_number, phone_number)';

// ── GET /dashboard ────────────────────────────────────────────
// Protected. Returns { borrowed: [...], lending: [...] } for current user.
// NOTE: must be defined before /:request_id to avoid route conflict.
router.get('/dashboard', async (req, res) => {
  let borrowedResult, lendingResult;

  try {
    [borrowedResult, lendingResult] = await Promise.all([
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
  } catch (err) {
    console.error('Dashboard query threw:', err);
    return res.status(503).json({ error: 'Dashboard temporarily unavailable — please retry' });
  }

  if (borrowedResult.error) {
    console.error('Borrowed query error:', borrowedResult.error.message);
    return res.status(503).json({ error: borrowedResult.error.message });
  }
  if (lendingResult.error) {
    console.error('Lending query error:', lendingResult.error.message);
    return res.status(503).json({ error: lendingResult.error.message });
  }

  res.json({
    borrowed: borrowedResult.data,
    lending: lendingResult.data,
  });
});

// ── POST / ────────────────────────────────────────────────────
// Protected. Creates a borrow request.
// Enforces: borrower_id = req.user.id, borrower ≠ owner, equipment must be available.
router.post('/', async (req, res) => {
  const { equipment_id, owner_id, requested_quantity } = req.body;

  if (!equipment_id || !owner_id) {
    return res.status(400).json({ error: 'equipment_id and owner_id are required' });
  }

  // Determine requested quantity, default to 1
  const qty = typeof requested_quantity === 'number' && requested_quantity > 0 ? Math.floor(requested_quantity) : 1;

  // Prevent self-borrowing
  if (owner_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot borrow your own item' });
  }

  // Verify equipment exists, is available, and has sufficient quantity
  const { data: equipment, error: eqError } = await serviceClient
    .from('equipment')
    .select('equipment_id, status, owner_id, quantity')
    .eq('equipment_id', equipment_id)
    .single();

  if (eqError || !equipment) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  if (equipment.status !== 'available') {
    return res.status(409).json({ error: 'Equipment is not currently available' });
  }
  if (equipment.quantity < qty) {
    return res.status(409).json({ error: `Only ${equipment.quantity} unit(s) available` });
  }

  const { data, error } = await serviceClient
    .from('borrow_requests')
    .insert({
      equipment_id,
      borrower_id: req.user.id, // always the authenticated user — never trust the body
      owner_id,
      status: 'pending',
      requested_quantity: qty,
    })
    .select(REQUEST_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── PUT /:request_id ──────────────────────────────────────────
// Protected. Owner-only: approve or reject a borrow request.
// On approval, decrement equipment quantity and update status accordingly.
router.put('/:request_id', async (req, res) => {
  const { request_id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
  }

  // Fetch request to verify ownership and retrieve requested quantity
  const { data: request, error: fetchError } = await serviceClient
    .from('borrow_requests')
    .select('request_id, owner_id, equipment_id, status, requested_quantity')
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

  // If approved, decrement equipment quantity and adjust status
  if (status === 'approved') {
    const qtyRequested = request.requested_quantity || 1;
    const { data: equip, error: eqErr } = await serviceClient
      .from('equipment')
      .select('quantity, status')
      .eq('equipment_id', request.equipment_id)
      .single();
    if (!eqErr && equip) {
      const newQty = Math.max(0, equip.quantity - qtyRequested);
      const newStatus = newQty > 0 ? 'available' : 'borrowed';
      await serviceClient
        .from('equipment')
        .update({ quantity: newQty, status: newStatus })
        .eq('equipment_id', request.equipment_id);
    } else {
      console.error('Failed to fetch equipment for quantity update:', eqErr?.message);
    }
  }

  res.json(data);
});

// ── DELETE /:request_id ───────────────────────────────────────
// Protected. Borrower-only: cancel a pending borrow request.
// Only allowed when status is 'pending' (cannot cancel approved/rejected).
router.delete('/:request_id', async (req, res) => {
  const { request_id } = req.params;

  // Fetch request to verify borrower and status
  const { data: request, error: fetchError } = await serviceClient
    .from('borrow_requests')
    .select('request_id, borrower_id, status')
    .eq('request_id', request_id)
    .single();

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Borrow request not found' });
  }
  if (request.borrower_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: you are not the borrower of this request' });
  }
  if (request.status !== 'pending') {
    return res.status(409).json({ error: 'Only pending requests can be cancelled' });
  }

  const { error } = await serviceClient
    .from('borrow_requests')
    .delete()
    .eq('request_id', request_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
