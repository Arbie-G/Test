import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Token payload:', payload);
    req.user = payload;
    return next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('Admin middleware - Token payload:', payload);
    req.user = payload;
    
    // Check if user is admin
    if (payload.role !== 'admin') {
      console.log('Admin middleware - Access denied for role:', payload.role);
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log('Admin middleware - Access granted for admin user');
    return next();
  } catch (error) {
    console.log('Admin middleware - Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}


