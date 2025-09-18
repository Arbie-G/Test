import { Router } from 'express';
import Board from '../models/Board.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function canAccess(board, userId) {
  const uid = String(userId);
  return String(board.owner) === uid || (board.members || []).some((m) => String(m) === uid);
}

router.post('/', requireAuth, async (req, res) => {
  const { title, data } = req.body || {};
  const board = await Board.create({ title: title || 'Untitled Board', owner: req.user.sub, members: [], data: data || {} });
  return res.status(201).json(board);
});

router.get('/:id', requireAuth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(board, req.user.sub)) return res.status(403).json({ error: 'Forbidden' });
  return res.json(board);
});

router.put('/:id', requireAuth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(board, req.user.sub)) return res.status(403).json({ error: 'Forbidden' });
  board.title = req.body.title ?? board.title;
  board.data = req.body.data ?? board.data;
  await board.save();
  // emit socket update
  const io = req.app.get('io');
  if (io) {
    io.to(`teamBoard:${board.id}`).emit('teamBoard:update', {
      id: board.id,
      data: board.data,
      title: board.title,
    });
  }
  return res.json(board);
});

router.post('/:id/share', requireAuth, async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== String(req.user.sub)) return res.status(403).json({ error: 'Only owner can share' });
  const { email } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!board.members.find((m) => String(m) === String(user.id))) {
    board.members.push(user.id);
    await board.save();
  }
  const io = req.app.get('io');
  if (io) io.to(`user:${user.id}`).emit('board:shared', { boardId: board.id, title: board.title });
  return res.json({ ok: true });
});

export default router;


