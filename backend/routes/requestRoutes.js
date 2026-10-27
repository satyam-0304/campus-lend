'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// All request routes are protected
router.use(authMiddleware);

// Reusable select string — joins equipment details and rich profile info
const REQUEST_SELECT =
  'request_id, equipment_id, borrower_id, owner_id, status, created_at, requested_quantity, ' +
  'request_type, rental_start_date, rental_end_date, total_amount, buyer_note, rental_duration_unit, ' +
  'equipment:equipment_id(equipment_name, image_url, category, sale_price, rate_per_day, rate_per_month, rate_per_semester), ' +
  'borrower:profiles!borrower_id(id, full_name, room_number, phone_number, hostel_name, branch, student_id), ' +
  'owner:profiles!owner_id(id, full_name, room_number, phone_number, hostel_name, branch, student_id)';

// ── GET /dashboard ──────────────────────────────────────────────────
// Protected. Returns { borrowed: [...], lending: [...] } for current user.
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

  // Privacy protection: for incoming lending requests that are still 'pending' or 'rejected',
  // do not expose borrower's room_number until the request is approved/active/returned/completed.
  const isRevealedStatus = (st) => ['approved', 'active', 'returned', 'completed'].includes(st);

  const sanitizedLending = (lendingResult.data || []).map((reqItem) => {
    if (!isRevealedStatus(reqItem.status) && reqItem.borrower) {
      return {
        ...reqItem,
        borrower: {
          ...reqItem.borrower,
          room_number: '', // Redacted until owner approves
        },
      };
    }
    return reqItem;
  });

  // Similarly for borrowed requests: owner's room_number is only shared when approved/active
  const sanitizedBorrowed = (borrowedResult.data || []).map((reqItem) => {
    if (!isRevealedStatus(reqItem.status) && reqItem.owner) {
      return {
        ...reqItem,
        owner: {
          ...reqItem.owner,
          room_number: '', // Redacted until request is approved
        },
      };
    }
    return reqItem;
  });

  res.json({
    borrowed: sanitizedBorrowed,
    lending: sanitizedLending,
  });
});

// ── POST / ──────────────────────────────────────────────────────────
// Protected. Creates a borrow or purchase request.
// Enforces: borrower_id = req.user.id, borrower ≠ owner, equipment must be available.
router.post('/', async (req, res) => {
  const {
    equipment_id,
    owner_id,
    requested_quantity,
    request_type,
    rental_start_date,
    rental_end_date,
    total_amount,
    buyer_note,
    rental_duration_unit,
  } = req.body;

  if (!equipment_id || !owner_id) {
    return res.status(400).json({ error: 'equipment_id and owner_id are required' });
  }

  // Determine requested quantity, default to 1
  const qty = typeof requested_quantity === 'number' && requested_quantity > 0 ? Math.floor(requested_quantity) : 1;

  // Prevent self-borrowing / self-purchasing
  if (owner_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot request your own item' });
  }

  // Verify equipment exists, is available, and has sufficient quantity
  const { data: equipment, error: eqError } = await serviceClient
    .from('equipment')
    .select('equipment_id, equipment_name, status, owner_id, quantity, listing_type')
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

  const effectiveRequestType = request_type === 'sell' ? 'sell' : 'rent';

  const insertPayload = {
    equipment_id,
    borrower_id: req.user.id,
    owner_id,
    status: 'pending',
    requested_quantity: qty,
    request_type: effectiveRequestType,
    rental_start_date: rental_start_date || null,
    rental_end_date: rental_end_date || null,
    total_amount: total_amount ? Number(total_amount) : null,
    buyer_note: buyer_note ? buyer_note.trim() : null,
    rental_duration_unit: rental_duration_unit || null,
  };

  const { data, error } = await serviceClient
    .from('borrow_requests')
    .insert(insertPayload)
    .select(REQUEST_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Send in-app notification to the owner
  const borrowerName = req.user.user_metadata?.full_name || 'A student';
  const actionWord = effectiveRequestType === 'sell' ? 'purchase' : 'rental';
  serviceClient
    .from('notifications')
    .insert({
      user_id: owner_id,
      title: `New ${actionWord.toUpperCase()} Request!`,
      message: `${borrowerName} submitted a ${actionWord} request for "${equipment.equipment_name}".`,
      type: 'request',
      link: 'dashboard',
    })
    .then(() => {});

  // Redact owner room_number from the newly created pending request response
  const sanitized = data && data.owner ? {
    ...data,
    owner: { ...data.owner, room_number: '' },
  } : data;

  res.status(201).json(sanitized);
});

// ── PUT /:request_id ────────────────────────────────────────────────
// Protected. Owner or borrower status transitions:
// 'approved', 'rejected', 'active' (handed over), 'returned', 'completed', 'cancelled'
router.put('/:request_id', async (req, res) => {
  const { request_id } = req.params;
  const { status } = req.body;

  const validStatuses = ['approved', 'rejected', 'active', 'returned', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  // Fetch request to verify ownership and retrieve metadata
  const { data: request, error: fetchError } = await serviceClient
    .from('borrow_requests')
    .select('request_id, owner_id, borrower_id, equipment_id, status, requested_quantity, request_type, equipment:equipment_id(equipment_name)')
    .eq('request_id', request_id)
    .single();

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Borrow request not found' });
  }

  const isOwner = request.owner_id === req.user.id;
  const isBorrower = request.borrower_id === req.user.id;

  // Borrower can only cancel if pending
  if (status === 'cancelled') {
    if (!isBorrower) return res.status(403).json({ error: 'Forbidden: only the requester can cancel' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'Only pending requests can be cancelled' });
  } else {
    // All other transitions require owner authority
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden: you are not the owner of this item' });
    }
  }

  // Update request status
  const { data, error } = await serviceClient
    .from('borrow_requests')
    .update({ status })
    .eq('request_id', request_id)
    .select(REQUEST_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const qtyRequested = request.requested_quantity || 1;
  const itemName = request.equipment?.equipment_name || 'your item';

  // 1. If approved, decrement equipment quantity
  if (status === 'approved') {
    const { data: equip } = await serviceClient
      .from('equipment')
      .select('quantity, status')
      .eq('equipment_id', request.equipment_id)
      .single();

    if (equip) {
      const newQty = Math.max(0, equip.quantity - qtyRequested);
      const newStatus = newQty > 0 ? 'available' : 'borrowed';
      await serviceClient
        .from('equipment')
        .update({ quantity: newQty, status: newStatus })
        .eq('equipment_id', request.equipment_id);
    }

    // Notify borrower
    await serviceClient.from('notifications').insert({
      user_id: request.borrower_id,
      title: 'Request Approved! 🎉',
      message: `Your request for "${itemName}" was approved! Contact the owner to coordinate pickup.`,
      type: 'request',
      link: 'dashboard',
    });
  }

  // 2. If marked 'active' (handed over)
  if (status === 'active') {
    await serviceClient.from('notifications').insert({
      user_id: request.borrower_id,
      title: 'Rental Active 📦',
      message: `Handover confirmed for "${itemName}". Enjoy your rental!`,
      type: 'request',
      link: 'dashboard',
    });
  }

  // 3. If marked 'returned' (item returned back to owner)
  if (status === 'returned') {
    // Restore quantity and available status
    const { data: equip } = await serviceClient
      .from('equipment')
      .select('quantity, status')
      .eq('equipment_id', request.equipment_id)
      .single();

    if (equip) {
      const restoredQty = equip.quantity + qtyRequested;
      await serviceClient
        .from('equipment')
        .update({ quantity: restoredQty, status: 'available' })
        .eq('equipment_id', request.equipment_id);
    }

    // Notify borrower to prompt review
    await serviceClient.from('notifications').insert({
      user_id: request.borrower_id,
      title: 'Item Returned! Rate your experience ★',
      message: `Return confirmed for "${itemName}". Please take 10 seconds to review the owner.`,
      type: 'review',
      link: 'dashboard',
    });
  }

  // 4. If marked 'completed' (for sales)
  if (status === 'completed') {
    await serviceClient.from('notifications').insert({
      user_id: request.borrower_id,
      title: 'Purchase Completed! Rate your item ★',
      message: `Purchase completed for "${itemName}". Please take a moment to leave a review.`,
      type: 'review',
      link: 'dashboard',
    });
  }

  // 5. If rejected
  if (status === 'rejected') {
    await serviceClient.from('notifications').insert({
      user_id: request.borrower_id,
      title: 'Request Declined',
      message: `Your request for "${itemName}" could not be accommodated at this time.`,
      type: 'request',
      link: 'dashboard',
    });
  }

  // If not approved/active/returned/completed, redact borrower room_number
  const isRevealed = ['approved', 'active', 'returned', 'completed'].includes(status);
  const sanitized = (data && !isRevealed && data.borrower) ? {
    ...data,
    borrower: { ...data.borrower, room_number: '' },
  } : data;

  res.json(sanitized);
});

// ── DELETE /:request_id ─────────────────────────────────────────────
// Protected. Borrower-only: cancel a pending borrow request.
router.delete('/:request_id', async (req, res) => {
  const { request_id } = req.params;

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
