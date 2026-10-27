'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// ── GET /equipment/:equipment_id ──────────────────────────────
// Public. Returns verified reviews for a specific piece of equipment.
router.get('/equipment/:equipment_id', async (req, res) => {
  const { equipment_id } = req.params;

  try {
    const { data, error } = await serviceClient
      .from('reviews')
      .select(`
        review_id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviewer_id (id, full_name, branch, hostel_name, batch_year)
      `)
      .eq('equipment_id', equipment_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[reviews] Fetch error:', error.message);
      return res.json([]);
    }

    res.json(data || []);
  } catch (err) {
    console.error('[reviews] Error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ── POST / ────────────────────────────────────────────────────
// Protected. Submits a review for an approved/completed transaction.
router.post('/', authMiddleware, async (req, res) => {
  const { request_id, equipment_id, rating, comment } = req.body;

  if (!request_id || !equipment_id || !rating) {
    return res.status(400).json({ error: 'request_id, equipment_id, and rating are required' });
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }

  try {
    // 1. Verify the request exists and is in a valid post-transaction state
    const { data: request, error: reqErr } = await serviceClient
      .from('borrow_requests')
      .select('request_id, borrower_id, owner_id, status, equipment:equipment_id(equipment_name)')
      .eq('request_id', request_id)
      .single();

    if (reqErr || !request) {
      return res.status(404).json({ error: 'Transaction request not found' });
    }

    // Must be approved, active, returned, or completed
    const validStatuses = ['approved', 'active', 'returned', 'completed'];
    if (!validStatuses.includes(request.status)) {
      return res.status(400).json({ error: 'You can only review items after the request is approved or completed' });
    }

    // Caller must be either borrower or owner
    const isBorrower = request.borrower_id === req.user.id;
    const isOwner = request.owner_id === req.user.id;
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ error: 'You are not a participant in this transaction' });
    }

    const reviewee_id = isBorrower ? request.owner_id : request.borrower_id;

    // 2. Insert review (unique constraint prevents duplicates)
    const { data: newReview, error: insertErr } = await serviceClient
      .from('reviews')
      .insert({
        request_id,
        equipment_id,
        reviewer_id: req.user.id,
        reviewee_id,
        rating: numRating,
        comment: (comment || '').trim(),
      })
      .select(`
        review_id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviewer_id (id, full_name, branch, hostel_name)
      `)
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted a review for this transaction' });
      }
      return res.status(500).json({ error: insertErr.message });
    }

    // 3. Notify the reviewee
    const reviewerName = req.user.user_metadata?.full_name || 'A student';
    const itemName = request.equipment?.equipment_name || 'an item';
    await serviceClient.from('notifications').insert({
      user_id: reviewee_id,
      title: 'New Review Received ★',
      message: `${reviewerName} gave you a ${numRating}-star rating for "${itemName}".`,
      type: 'review',
      link: 'dashboard',
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.error('[reviews] Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
