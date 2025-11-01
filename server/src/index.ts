import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { StateManager } from './state/StateManager';
import { EventHandlers } from './events/handlers';
import { TimerManager } from './timer/TimerManager';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development - restrict in production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Initialize state manager, timer manager, and event handlers
const stateManager = StateManager.getInstance();
const timerManager = TimerManager.getInstance();
const eventHandlers = new EventHandlers(io);

// Basic health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// State endpoint for debugging
app.get('/state', (_req: Request, res: Response) => {
  res.json(stateManager.getState());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Register all event handlers
  eventHandlers.registerHandlers(socket);

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Initiative Tracker Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  timerManager.destroy();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  timerManager.destroy();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
