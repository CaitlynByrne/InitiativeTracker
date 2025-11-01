import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { StateManager } from './state/StateManager';
import { EventHandlers } from './events/handlers';
import { TimerManager } from './timer/TimerManager';
import { RedisClient } from './persistence/RedisClient';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development - restrict in production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Initialize Redis, state manager, timer manager, and event handlers
const redis = RedisClient.getInstance();
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

// Initialize server with Redis connection and state loading
async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Redis connected successfully');

    // Load saved state from Redis
    const loaded = await stateManager.loadFromRedis();
    if (loaded) {
      logger.info('Previous state restored from Redis');
    } else {
      logger.info('Starting with fresh state');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Initiative Tracker Server running on port ${PORT}`);
      logger.info(`WebSocket server ready`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    // Continue without Redis if it fails
    logger.warn('Starting server without Redis persistence');
    httpServer.listen(PORT, () => {
      logger.info(`Initiative Tracker Server running on port ${PORT} (WITHOUT REDIS)`);
      logger.info(`WebSocket server ready`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  timerManager.destroy();
  await redis.disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server...');
  timerManager.destroy();
  await redis.disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
