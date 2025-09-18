import { Router } from 'express';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Unread counts per user
router.get('/unread/counts', requireAuth, async (req, res) => {
  const me = req.user.sub;
  const pipeline = [
    { $match: { to: new (await import('mongoose')).default.Types.ObjectId(me), readAt: { $exists: false } } },
    { $group: { _id: '$from', count: { $sum: 1 } } },
  ];
  const agg = await Message.aggregate(pipeline);
  const counts = Object.fromEntries(agg.map((a) => [String(a._id), a.count]));
  return res.json(counts);
});

// List conversation with a user
router.get('/:userId', requireAuth, async (req, res) => {
  const other = req.params.userId;
  const me = req.user.sub;
  const msgs = await Message.find({
    $or: [
      { from: me, to: other },
      { from: other, to: me },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();
  return res.json(msgs);
});

// Send a message
router.post('/:userId', requireAuth, async (req, res) => {
  const to = req.params.userId;
  const me = req.user.sub;
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'Message body required' });
  const msg = await Message.create({ from: me, to, body });
  const io = req.app.get('io');
  if (io) io.to(`user:${to}`).emit('msg:new', { ...msg.toObject(), id: String(msg._id) });
  return res.status(201).json(msg);
});

// Mark conversation read
router.post('/:userId/read', requireAuth, async (req, res) => {
  const other = req.params.userId;
  const me = req.user.sub;
  await Message.updateMany({ from: other, to: me, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  return res.json({ ok: true });
});

export default router;


