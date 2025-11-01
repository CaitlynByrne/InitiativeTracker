import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { StateManager } from './state/StateManager';
import { EventHandlers } from './events/handlers';
import { TimerManager } from './timer/TimerManager';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development - restrict in production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

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
  logger.info(`Client connected: ${socket.id}`);

  // Register all event handlers
  eventHandlers.registerHandlers(socket);

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Initiative Tracker Server running on port ${PORT}`);
  logger.info(`WebSocket server ready`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  timerManager.destroy();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server...');
  timerManager.destroy();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
