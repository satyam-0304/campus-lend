'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const VALID_CATEGORIES = ['academics', 'electronics', 'sports', 'event_wear'];

// Reusable select string — joins owner profile via FK
const EQUIPMENT_SELECT =
  'equipment_id, equipment_name, category, status, owner_id, image_url, created_at, ' +
  'owner:profiles!owner_id(id, full_name, room_number, phone_number)';

// ── GET / ─────────────────────────────────────────────────────
// Public. Returns all available equipment with owner info.
router.get('/', async (_req, res) => {
  const { data, error } = await serviceClient
    .from('equipment')
    .select(EQUIPMENT_SELECT)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST / ────────────────────────────────────────────────────
// Protected. Adds a new item. owner_id is always forced to req.user.id.
// image_url accepts a plain text URL string or null (Storage is out of scope).
router.post('/', authMiddleware, async (req, res) => {
  const { equipment_name, category, image_url } = req.body;

  if (!equipment_name || typeof equipment_name !== 'string' || !equipment_name.trim()) {
    return res.status(400).json({ error: 'equipment_name is required' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  const { data, error } = await serviceClient
    .from('equipment')
    .insert({
      equipment_name: equipment_name.trim(),
      category,
      status: 'available',
      owner_id: req.user.id,          // always the authenticated user — body value ignored
      image_url: image_url || null,   // plain URL string or null; no upload logic
    })
    .select(EQUIPMENT_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── DELETE /:equipment_id ─────────────────────────────────────
// Protected. Deletes item only if authenticated user is the owner.
router.delete('/:equipment_id', authMiddleware, async (req, res) => {
  const { equipment_id } = req.params;

  // Verify ownership before deleting
  const { data: item, error: fetchError } = await serviceClient
    .from('equipment')
    .select('owner_id')
    .eq('equipment_id', equipment_id)
    .single();

  if (fetchError || !item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  if (item.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: you do not own this item' });
  }

  const { error } = await serviceClient
    .from('equipment')
    .delete()
    .eq('equipment_id', equipment_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
