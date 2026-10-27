'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ── GET / ─────────────────────────────────────────────────────
// Returns list of user's notifications and unread count
router.get('/', async (req, res) => {
  try {
    const { data: notifications, error } = await serviceClient
      .from('notifications')
      .select('notification_id, user_id, title, message, type, link, is_read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[notifications] Query error:', error.message);
      return res.json({ notifications: [], unread_count: 0 });
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    res.json({
      notifications: notifications || [],
      unread_count: unreadCount,
    });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── PUT /:id/read ─────────────────────────────────────────────
// Marks a single notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await serviceClient
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /read-all ─────────────────────────────────────────────
// Marks all notifications for user as read
router.put('/read-all', async (req, res) => {
  try {
    const { error } = await serviceClient
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
