'use strict';

const express = require('express');
const router = express.Router();
const { serviceClient } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ── GET /conversations ──────────────────────────────────────────
// Returns the list of all active/past conversations for authenticated user
router.get('/conversations', async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 1. Fetch recent messages involving current user
    const { data: messages, error } = await serviceClient
      .from('messages')
      .select(`
        message_id,
        request_id,
        equipment_id,
        sender_id,
        recipient_id,
        content,
        is_read,
        created_at
      `)
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(600);

    if (error) {
      console.warn('[messages/conversations] Fetch error:', error.message);
      return res.json([]);
    }

    if (!messages || messages.length === 0) {
      return res.json([]);
    }

    // 2. Group messages by the conversation partner (other_user_id)
    const convMap = new Map();
    const otherUserIds = new Set();
    const equipmentIds = new Set();

    for (const msg of messages) {
      const otherId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
      otherUserIds.add(otherId);
      if (msg.equipment_id) equipmentIds.add(msg.equipment_id);

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          other_user_id: otherId,
          last_message: {
            message_id: msg.message_id,
            content: msg.content,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            is_read: msg.is_read,
          },
          unread_count: 0,
          equipment_id: msg.equipment_id || null,
          request_id: msg.request_id || null,
        });
      }

      // Count unread incoming messages
      if (msg.recipient_id === currentUserId && !msg.is_read) {
        convMap.get(otherId).unread_count += 1;
      }
    }

    // 3. Batch fetch profiles for all conversation partners
    const otherIdList = Array.from(otherUserIds);
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, hostel_name, room_number, residence_type')
      .in('id', otherIdList);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 4. Batch fetch equipment names if equipment IDs present
    let equipmentMap = new Map();
    if (equipmentIds.size > 0) {
      const { data: equipmentList } = await serviceClient
        .from('equipment')
        .select('equipment_id, equipment_name')
        .in('equipment_id', Array.from(equipmentIds));

      equipmentMap = new Map((equipmentList || []).map((e) => [e.equipment_id, e.equipment_name]));
    }

    // 5. Construct conversation summary array
    const result = [];
    for (const [otherId, conv] of convMap.entries()) {
      const prof = profileMap.get(otherId);
      const eqName = conv.equipment_id ? equipmentMap.get(conv.equipment_id) : undefined;
      const location = prof?.residence_type === 'day_scholar'
        ? 'Day Scholar'
        : prof?.hostel_name
        ? `${prof.hostel_name}${prof.room_number ? ` (Rm ${prof.room_number})` : ''}`
        : 'PEC Student';

      result.push({
        other_user_id: otherId,
        other_user_name: prof?.full_name || 'PEC Student',
        other_user_location: location,
        last_message: conv.last_message.content,
        last_message_time: conv.last_message.created_at,
        last_sender_id: conv.last_message.sender_id,
        unread_count: conv.unread_count,
        equipment_id: conv.equipment_id || undefined,
        equipment_name: eqName || undefined,
        request_id: conv.request_id || undefined,
      });
    }

    // Return sorted by most recent activity
    result.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

    res.json(result);
  } catch (err) {
    console.error('[messages/conversations] Error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ── GET /conversation ─────────────────────────────────────────
// Fetches chat history between authenticated user and another student
router.get('/conversation', async (req, res) => {
  let { equipment_id, other_user_id, request_id } = req.query;

  if (!other_user_id && !request_id) {
    return res.status(400).json({ error: 'other_user_id or request_id is required' });
  }

  try {
    // If only request_id is provided, verify participant access & resolve other_user_id
    if (!other_user_id && request_id) {
      const { data: reqData, error: reqErr } = await serviceClient
        .from('borrow_requests')
        .select('borrower_id, owner_id, equipment_id')
        .eq('request_id', request_id)
        .single();

      if (reqErr || !reqData) {
        return res.status(404).json({ error: 'Borrow request not found' });
      }

      if (reqData.borrower_id !== req.user.id && reqData.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to view this conversation' });
      }

      other_user_id = reqData.borrower_id === req.user.id ? reqData.owner_id : reqData.borrower_id;
      if (!equipment_id) equipment_id = reqData.equipment_id;
    }

    // Link prior unlinked pre-request inquiry messages between these students for this equipment
    if (request_id && equipment_id) {
      serviceClient
        .from('messages')
        .update({ request_id })
        .eq('equipment_id', equipment_id)
        .is('request_id', null)
        .or(
          `and(sender_id.eq.${req.user.id},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${req.user.id})`
        )
        .then(() => {})
        .catch(() => {});
    }

    // Build the query: always enforce that the authenticated user is one of the conversation participants
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
      .or(
        `and(sender_id.eq.${req.user.id},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${req.user.id})`
      )
      .order('created_at', { ascending: true });

    // If equipment_id is specified, include messages for this equipment or general messages
    // (Never exclude pre-request messages that have request_id = null)
    if (equipment_id) {
      if (request_id) {
        query = query.or(
          `equipment_id.eq.${equipment_id},request_id.eq.${request_id},equipment_id.is.null`
        );
      } else {
        query = query.or(`equipment_id.eq.${equipment_id},equipment_id.is.null`);
      }
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
        .then(() => {})
        .catch(() => {});
    }

    res.json(data || []);
  } catch (err) {
    console.error('[messages] Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── PUT /read ─────────────────────────────────────────────────
// Marks all unread messages from a specific other_user_id as read
router.put('/read', async (req, res) => {
  const { other_user_id } = req.body;
  if (!other_user_id) {
    return res.status(400).json({ error: 'other_user_id is required' });
  }

  try {
    const { error } = await serviceClient
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', req.user.id)
      .eq('sender_id', other_user_id)
      .eq('is_read', false);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    let resolvedEquipmentId = equipment_id || null;

    // If equipment_id wasn't passed but request_id was, look up equipment_id
    if (!resolvedEquipmentId && request_id) {
      const { data: reqData } = await serviceClient
        .from('borrow_requests')
        .select('equipment_id')
        .eq('request_id', request_id)
        .single();
      if (reqData?.equipment_id) {
        resolvedEquipmentId = reqData.equipment_id;
      }
    }

    const { data: message, error } = await serviceClient
      .from('messages')
      .insert({
        sender_id: req.user.id,
        recipient_id,
        equipment_id: resolvedEquipmentId,
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

    // Send in-app notification to the recipient with direct chat link metadata
    const senderName = req.user.user_metadata?.full_name || 'A student';
    const linkData = `chat:${req.user.id}?name=${encodeURIComponent(senderName)}${
      resolvedEquipmentId ? `&equipment_id=${resolvedEquipmentId}` : ''
    }${request_id ? `&request_id=${request_id}` : ''}`;

    serviceClient
      .from('notifications')
      .insert({
        user_id: recipient_id,
        title: `Message from ${senderName}`,
        message: content.trim().length > 60 ? `${content.trim().slice(0, 57)}...` : content.trim(),
        type: 'chat',
        link: linkData,
      })
      .then(() => {})
      .catch((err) => console.warn('[messages/notification] Error:', err.message));

    res.status(201).json(message);
  } catch (err) {
    console.error('[messages] Send error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
