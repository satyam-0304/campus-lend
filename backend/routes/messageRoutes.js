'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ── GET /conversation ─────────────────────────────────────────
// Fetches chat history between authenticated user and another student
router.get('/conversation', async (req, res) => {
  const { equipment_id, other_user_id, request_id } = req.query;

  if (!other_user_id && !request_id) {
    return res.status(400).json({ error: 'other_user_id or request_id is required' });
  }

  try {
    let query = serviceClient
      .from('messages')
      .select(`
        message_id,
        request_id,
        equipment_id,
        sender_id,
        recipient_id,
        content,
        is_read,
        created_at,
        sender:profiles!sender_id(id, full_name)
      `)
      .order('created_at', { ascending: true });

    if (request_id) {
      query = query.eq('request_id', request_id);
    } else if (equipment_id && other_user_id) {
      query = query
        .eq('equipment_id', equipment_id)
        .or(
          `and(sender_id.eq.${req.user.id},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${req.user.id})`
        );
    } else {
      query = query.or(
        `and(sender_id.eq.${req.user.id},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${req.user.id})`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[messages] Fetch error:', error.message);
      return res.json([]);
    }

    // Mark any unread messages sent to req.user.id as read
    const unreadIds = (data || [])
      .filter((m) => m.recipient_id === req.user.id && !m.is_read)
      .map((m) => m.message_id);

    if (unreadIds.length > 0) {
      serviceClient
        .from('messages')
        .update({ is_read: true })
        .in('message_id', unreadIds)
        .then(() => {});
    }

    res.json(data || []);
  } catch (err) {
    console.error('[messages] Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── POST / ────────────────────────────────────────────────────
// Sends a chat message
router.post('/', async (req, res) => {
  const { recipient_id, equipment_id, request_id, content } = req.body;

  if (!recipient_id || !content || !content.trim()) {
    return res.status(400).json({ error: 'recipient_id and content are required' });
  }

  if (recipient_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot message yourself' });
  }

  try {
    const { data: message, error } = await serviceClient
      .from('messages')
      .insert({
        sender_id: req.user.id,
        recipient_id,
        equipment_id: equipment_id || null,
        request_id: request_id || null,
        content: content.trim(),
        is_read: false,
      })
      .select(`
        message_id,
        request_id,
        equipment_id,
        sender_id,
        recipient_id,
        content,
        is_read,
        created_at,
        sender:profiles!sender_id(id, full_name)
      `)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Send in-app notification to the recipient
    const senderName = req.user.user_metadata?.full_name || 'A student';
    serviceClient
      .from('notifications')
      .insert({
        user_id: recipient_id,
        title: `Message from ${senderName}`,
        message: content.trim().length > 60 ? `${content.trim().slice(0, 57)}...` : content.trim(),
        type: 'chat',
        link: request_id ? `dashboard` : undefined,
      })
      .then(() => {});

    res.status(201).json(message);
  } catch (err) {
    console.error('[messages] Send error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
