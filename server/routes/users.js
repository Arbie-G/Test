import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const router = Router();

// Temporary in-memory storage for development
const connections = new Map();

// Check if we're connected to MongoDB
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Import users from auth route (shared in-memory storage)
import { users } from './auth.js';

router.get('/me', requireAuth, async (req, res) => {
  try {
    let user;
    
    if (isMongoConnected()) {
      // Use MongoDB
      user = await User.findById(req.user.sub);
      if (!user) {
        console.log('User not found with ID:', req.user.sub);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('Found user (MongoDB):', { email: user.email, role: user.role });
      res.json({ 
        id: user._id.toString(),
        email: user.email, 
        name: user.name, 
        role: user.role, 
        isAdmin: user.role === 'admin' 
      });
    } else {
      // Use in-memory storage - find user by email from JWT payload
      const userEmail = req.user.email;
      user = Array.from(users.values()).find(u => u.email === userEmail);
      
      if (!user) {
        console.log('User not found with email:', userEmail);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Found user (in-memory):', { email: user.email, role: user.role });
      res.json({ 
        id: user.id,
        email: user.email, 
        name: user.name, 
        role: user.role, 
        isAdmin: user.role === 'admin' 
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    let user;
    
    if (isMongoConnected()) {
      // Use MongoDB
      user = await User.findById(req.user.sub);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      if (name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      
      await user.save();
      
      return res.json({ 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        avatarUrl: user.avatarUrl,
        role: user.role 
      });
    } else {
      // Use in-memory storage
      const userEmail = req.user.email;
      user = Array.from(users.values()).find(u => u.email === userEmail);
      
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      if (name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      
      // Update the user in the Map
      users.set(userEmail, user);
      
      return res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        avatarUrl: user.avatarUrl,
        role: user.role 
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  const users = global.users || new Map();
  const allUsers = Array.from(users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl
  }));
  return res.json(allUsers);
});

router.post('/ping', requireAuth, async (req, res) => {
  const { toUserId, message } = req.body || {};
  if (!toUserId) return res.status(400).json({ error: 'toUserId is required' });
  // Send real-time notification if socket.io is available on app locals
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${toUserId}`).emit('ping', { from: req.user.sub, message: message || '👋' });
  }
  return res.json({ ok: true, from: req.user.sub, to: toUserId, message: message || '👋' });
});

// Connection endpoints
router.get('/connections', requireAuth, async (req, res) => {
  const userConnections = Array.from(connections.values()).filter(conn => 
    conn.userId === req.user.sub || conn.connectedUserId === req.user.sub
  );
  return res.json(userConnections);
});

router.post('/connections', requireAuth, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (userId === req.user.sub) return res.status(400).json({ error: 'Cannot connect to yourself' });
  
  // Check if connection already exists
  const existingConnection = Array.from(connections.values()).find(conn => 
    (conn.userId === req.user.sub && conn.connectedUserId === userId) ||
    (conn.userId === userId && conn.connectedUserId === req.user.sub)
  );
  
  if (existingConnection) {
    return res.status(409).json({ error: 'Connection already exists' });
  }
  
  const connectionId = Date.now().toString();
  const connection = {
    id: connectionId,
    userId: req.user.sub,
    connectedUserId: userId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  connections.set(connectionId, connection);
  return res.json(connection);
});

router.patch('/connections/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const connection = connections.get(id);
  if (!connection) return res.status(404).json({ error: 'Connection not found' });
  
  if (connection.connectedUserId !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorized to modify this connection' });
  }
  
  connection.status = status;
  connections.set(id, connection);
  return res.json(connection);
});

router.delete('/connections/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  const connection = connections.get(id);
  if (!connection) return res.status(404).json({ error: 'Connection not found' });
  
  if (connection.userId !== req.user.sub && connection.connectedUserId !== req.user.sub) {
    return res.status(403).json({ error: 'Not authorized to delete this connection' });
  }
  
  connections.delete(id);
  return res.json({ ok: true });
});

export default router;


