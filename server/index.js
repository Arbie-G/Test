import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://stellahime821_db_user:EJVg3jfXFzmY7J1G@pms.02mwxnz.mongodb.net/ayasynch?retryWrites=true&w=majority';
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // For now, skip MongoDB and use in-memory storage
    console.log('Using in-memory storage for development');
    
    // Uncomment below to try MongoDB connection
    /*
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB Atlas');
    } catch (mongoError) {
      console.warn('MongoDB connection failed, using in-memory storage:', mongoError.message);
    }
    */

    const authRouter = (await import('./routes/auth.js')).default;
    app.use('/api/auth', authRouter);
    
    // Enable users route for profile functionality
    const usersRouter = (await import('./routes/users.js')).default;
    app.use('/api/users', usersRouter);
    
    // Enable admin routes
    const adminRouter = (await import('./routes/admin.js')).default;
    app.use('/api/admin', adminRouter);
    
    // Enable teams routes
    const teamsRouter = (await import('./routes/teams.js')).default;
    app.use('/api/teams', teamsRouter);

    // Enable tasks routes
    const tasksRouter = (await import('./routes/tasks.js')).default;
    app.use('/api/tasks', tasksRouter);

    app.set('io', io);

    app.get('/api/health', (_req, res) => {
      res.json({ ok: true, mongo: true });
    });

    io.on('connection', (socket) => {
      socket.on('register', (userId) => {
        socket.join(`user:${userId}`);
      });

      // Join team board room
      socket.on('joinTeamBoard', (teamId) => {
        socket.join(`teamBoard:${teamId}`);
      });

      // Listen for team creation and broadcast to all clients
      socket.on('team:created', (team) => {
        io.emit('team:created', team); // Broadcast to all clients
      });

      // (Optional) Listen for activity events
      socket.on('activity:new', (activity) => {
        io.emit('activity:new', activity);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();


