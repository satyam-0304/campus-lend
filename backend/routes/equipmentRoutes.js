'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const VALID_CATEGORIES = ['academics', 'electronics', 'sports', 'event_wear'];

// Public equipment select: does NOT expose room_number or phone_number
const PUBLIC_EQUIPMENT_SELECT =
  'equipment_id, equipment_name, category, status, owner_id, image_url, image_back_url, price_note, ' +
  'quantity, listing_type, sale_price, rate_per_day, rate_per_month, rate_per_semester, created_at, ' +
  'owner:profiles!owner_id(id, full_name, hostel_name, branch, batch_year, degree)';

// Owner equipment select (used for /mine or newly created listings by the owner):
const OWNER_EQUIPMENT_SELECT =
  'equipment_id, equipment_name, category, status, owner_id, image_url, image_back_url, price_note, ' +
  'quantity, listing_type, sale_price, rate_per_day, rate_per_month, rate_per_semester, created_at, ' +
  'owner:profiles!owner_id(id, full_name, hostel_name, room_number, phone_number, branch, batch_year, degree)';

// Helper to attach verified review stats to equipment items
async function enrichWithRatings(equipmentList) {
  if (!equipmentList || equipmentList.length === 0) return equipmentList;
  try {
    const ids = equipmentList.map((e) => e.equipment_id);
    const { data: reviews } = await serviceClient
      .from('reviews')
      .select('equipment_id, rating')
      .in('equipment_id', ids);

    const statsMap = {};
    (reviews || []).forEach((r) => {
      if (!statsMap[r.equipment_id]) {
        statsMap[r.equipment_id] = { total: 0, count: 0 };
      }
      statsMap[r.equipment_id].total += r.rating;
      statsMap[r.equipment_id].count += 1;
    });

    return equipmentList.map((item) => {
      const stats = statsMap[item.equipment_id];
      const avg = stats ? Number((stats.total / stats.count).toFixed(1)) : 0;
      const count = stats ? stats.count : 0;
      return {
        ...item,
        avg_rating: avg,
        review_count: count,
      };
    });
  } catch {
    return equipmentList.map((item) => ({ ...item, avg_rating: 0, review_count: 0 }));
  }
}

// ── GET / ──────────────────────────────────────────────────────────
// Public. Returns all available equipment with sanitized owner info (room_number kept private) and rating stats.
router.get('/', async (req, res) => {
  const { data, error } = await serviceClient
    .from('equipment')
    .select(PUBLIC_EQUIPMENT_SELECT)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Sanitize phone numbers for unauthenticated visitors
  const hasAuth = Boolean(req.headers.authorization);
  const sanitized = (data || []).map((item) => {
    if (!hasAuth && item.owner) {
      return {
        ...item,
        owner: {
          ...item.owner,
          phone_number: '', // hide private contact until logged in
        },
      };
    }
    return item;
  });

  const enriched = await enrichWithRatings(sanitized);
  res.json(enriched);
});

// ── GET /mine ──────────────────────────────────────────────────────
// Protected. Returns all equipment listed by the authenticated user (all statuses).
router.get('/mine', authMiddleware, async (req, res) => {
  const { data, error } = await serviceClient
    .from('equipment')
    .select(OWNER_EQUIPMENT_SELECT)
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const enriched = await enrichWithRatings(data || []);
  res.json(enriched);
});

// ── POST / ─────────────────────────────────────────────────────────
// Protected. Adds a new item. owner_id is always forced to req.user.id.
// image_url (front photo) is required; image_back_url (back photo) is required for new listings.
// supports listing_type ('sell' | 'rent'), sale_price, rate_per_day, rate_per_month, rate_per_semester, quantity.
router.post('/', authMiddleware, async (req, res) => {
  const {
    equipment_name,
    category,
    image_url,
    image_back_url,
    price_note,
    quantity,
    listing_type,
    sale_price,
    rate_per_day,
    rate_per_month,
    rate_per_semester,
  } = req.body;

  if (!equipment_name || typeof equipment_name !== 'string' || !equipment_name.trim()) {
    return res.status(400).json({ error: 'equipment_name is required' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }
  if (!image_url || typeof image_url !== 'string' || !image_url.trim()) {
    return res.status(400).json({ error: 'Front photo is required — please upload an image of the item.' });
  }
  if (!image_back_url || typeof image_back_url !== 'string' || !image_back_url.trim()) {
    return res.status(400).json({ error: 'Back photo is required — please upload a back/reverse view of the item.' });
  }

  const normalizedListingType = listing_type === 'sell' ? 'sell' : 'rent';
  const parsedQty = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : (parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1);
  const parsedSalePrice = normalizedListingType === 'sell' && sale_price !== null && sale_price !== undefined && !isNaN(Number(sale_price))
    ? Number(sale_price)
    : null;
  const parsedRateDay = normalizedListingType === 'rent' && rate_per_day !== null && rate_per_day !== undefined && !isNaN(Number(rate_per_day))
    ? Number(rate_per_day)
    : null;
  const parsedRateMonth = normalizedListingType === 'rent' && rate_per_month !== null && rate_per_month !== undefined && !isNaN(Number(rate_per_month))
    ? Number(rate_per_month)
    : null;
  const parsedRateSemester = normalizedListingType === 'rent' && rate_per_semester !== null && rate_per_semester !== undefined && !isNaN(Number(rate_per_semester))
    ? Number(rate_per_semester)
    : null;

  // Build a friendly display string for price_note if none was explicitly given
  let effectivePriceNote = price_note ? price_note.trim() : '';
  if (!effectivePriceNote) {
    if (normalizedListingType === 'sell' && parsedSalePrice !== null) {
      effectivePriceNote = `₹${parsedSalePrice} (For Sale)`;
    } else if (normalizedListingType === 'rent') {
      const parts = [];
      if (parsedRateDay !== null) parts.push(`₹${parsedRateDay}/day`);
      if (parsedRateMonth !== null) parts.push(`₹${parsedRateMonth}/mo`);
      if (parsedRateSemester !== null) parts.push(`₹${parsedRateSemester}/sem`);
      effectivePriceNote = parts.join(' • ') || 'Free / Flexible';
    }
  }

  const { data, error } = await serviceClient
    .from('equipment')
    .insert({
      equipment_name: equipment_name.trim(),
      category,
      status: 'available',
      owner_id: req.user.id, // always the authenticated user — body value ignored
      image_url: image_url.trim(),
      image_back_url: image_back_url.trim(),
      price_note: effectivePriceNote || null,
      quantity: parsedQty,
      listing_type: normalizedListingType,
      sale_price: parsedSalePrice,
      rate_per_day: parsedRateDay,
      rate_per_month: parsedRateMonth,
      rate_per_semester: parsedRateSemester,
    })
    .select(OWNER_EQUIPMENT_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ── DELETE /:equipment_id ──────────────────────────────────────────
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
