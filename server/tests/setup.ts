// Test setup file for Jest
import { afterAll, beforeAll } from '@jest/globals';

// Mock Redis client for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    hSet: jest.fn(),
    hGet: jest.fn(),
    hGetAll: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isReady: true,
    isOpen: true
  }))
}));

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.LOG_LEVEL = 'error';
});

// Global test teardown
afterAll(async () => {
  // Clean up any test resources
  jest.clearAllMocks();
  jest.resetModules();
});