import { Router } from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/team/:teamId', requireAuth, async (req, res) => {
  const tasks = await Task.find({ teamId: req.params.teamId });
  // Map _id to id for frontend compatibility
  res.json(tasks.map(task => ({
    ...task.toObject(),
    id: task._id,
  })));
});

router.post('/team/:teamId', requireAuth, async (req, res) => {
  const { title, description, assignedTo, status, priority } = req.body;
  const task = await Task.create({
    teamId: req.params.teamId,
    title,
    description,
    assignedTo,
    status,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.sub,
  });
  const io = req.app.get('io');
  if (io) io.to(`teamBoard:${req.params.teamId}`).emit('teamBoard:update', { task: { ...task.toObject(), id: task._id } });
  res.status(201).json({ ...task.toObject(), id: task._id });
});

router.put('/:id', requireAuth, async (req, res) => {
  if (!req.params.id || req.params.id === "undefined") {
    return res.status(400).json({ error: "Invalid task ID" });
  }
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body, { updatedAt: new Date().toISOString() });
  await task.save();
  const io = req.app.get('io');
  if (io) io.to(`teamBoard:${task.teamId}`).emit('teamBoard:update', { task: { ...task.toObject(), id: task._id } });
  res.json({ ...task.toObject(), id: task._id });
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (!req.params.id || req.params.id === "undefined") {
    return res.status(400).json({ error: "Invalid task ID" });
  }
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  await task.deleteOne();
  const io = req.app.get('io');
  if (io) io.to(`teamBoard:${task.teamId}`).emit('teamBoard:update', { deletedTaskId: String(task._id) });
  res.json({ ok: true });
});

// REMOVE TypeScript types from these functions:
const updateTaskStatus = (taskId, status) => {
  if (!taskId) return;
  apiUpdateTask(taskId, { status }).then(() => {
    loadTasks();
  });
};

const deleteTask = (taskId) => {
  if (!taskId) return;
  apiDeleteTask(taskId).then(() => {
    loadTasks();
  });
};

export default router;