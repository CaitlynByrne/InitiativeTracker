// Integration test setup
import { beforeAll, afterAll } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SERVER_URL = process.env.SERVER_URL || 'http://server-test:3001';
process.env.DM_CONSOLE_URL = process.env.DM_CONSOLE_URL || 'http://dm-console-test:5173';

// Global test timeout for integration tests
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(() => {
  // Ensure all connections are closed
  jest.clearAllTimers();
});