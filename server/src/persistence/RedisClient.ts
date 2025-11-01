/**
 * Redis client wrapper for state persistence
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Connect to Redis server
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      logger.info('Redis client already connected');
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.connected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis client disconnected gracefully');
    }
  }

  /**
   * Save data to Redis
   */
  public async save(key: string, value: any, expirySeconds?: number): Promise<void> {
    if (!this.client || !this.connected) {
      logger.error('Redis client not connected, cannot save data');
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (expirySeconds) {
        await this.client.setEx(key, expirySeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      logger.debug(`Saved to Redis: ${key}`);
    } catch (error) {
      logger.error(`Failed to save to Redis: ${key}`, error);
    }
  }

  /**
   * Load data from Redis
   */
  public async load<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      logger.error('Redis client not connected, cannot load data');
      return null;
    }

    try {
      const data = await this.client.get(key);

      if (!data) {
        logger.debug(`No data found in Redis for key: ${key}`);
        return null;
      }

      const parsed = JSON.parse(data) as T;
      logger.debug(`Loaded from Redis: ${key}`);
      return parsed;
    } catch (error) {
      logger.error(`Failed to load from Redis: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete data from Redis
   */
  public async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      logger.error('Redis client not connected, cannot delete data');
      return;
    }

    try {
      await this.client.del(key);
      logger.debug(`Deleted from Redis: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete from Redis: ${key}`, error);
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get all keys matching a pattern
   */
  public async getKeys(pattern: string): Promise<string[]> {
    if (!this.client || !this.connected) {
      logger.error('Redis client not connected, cannot get keys');
      return [];
    }

    try {
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error(`Failed to get keys from Redis: ${pattern}`, error);
      return [];
    }
  }
}
