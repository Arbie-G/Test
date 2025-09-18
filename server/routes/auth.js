import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Temporary in-memory storage for development
const users = new Map();

// Export users for other routes to access
export { users };

// Check if we're connected to MongoDB
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    if (isMongoConnected()) {
      // Use MongoDB
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        passwordHash,
        name,
        role: role || 'user',
        isActive: true,
      });

      res.status(201).json({ ok: true, user: { email: user.email, name: user.name, id: user.id } });
    } else {
      // Use in-memory storage
      if (users.has(email)) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: Date.now().toString(),
        email,
        passwordHash,
        name: name || email.split('@')[0],
        role: role || 'user',
        isActive: true
      };
      
      users.set(email, user);
      console.log('User registered in memory:', { email, role: user.role });
      
      res.status(201).json({ ok: true, user: { email: user.email, name: user.name, id: user.id } });
    }
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log('Login attempt:', { email, userType });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    
    if (isMongoConnected()) {
      // Use MongoDB
      user = await User.findOne({ email });
    } else {
      // Use in-memory storage
      user = users.get(email);
      console.log('Checking in-memory users:', Array.from(users.keys()));
    }

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', { email: user.email, role: user.role });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user type matches the login section
    if (userType && user.role !== userType) {
      console.log('Role mismatch:', { userType, userRole: user.role });
      return res.status(403).json({
        error: `This account is registered as ${user.role}. Please use the ${user.role} login section.`
      });
    }

    console.log('Login successful for:', { email: user.email, role: user.role });

    // Generate JWT token
    const userId = isMongoConnected() ? user._id.toString() : user.id;
    const token = jwt.sign(
      { sub: userId, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      user: { email: user.email, name: user.name, id: userId, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;


