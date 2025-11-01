/**
 * TimerManager - Manages countdown timer with integration to StateManager
 *
 * Handles tick intervals, timer expiration, and state synchronization.
 */

import { StateManager } from '../state/StateManager';
import { logger } from '../utils/logger';

export class TimerManager {
  private stateManager: StateManager;
  private interval: NodeJS.Timeout | null = null;
  private static instance: TimerManager;

  private constructor() {
    this.stateManager = StateManager.getInstance();

    // Listen to state changes to manage timer
    this.stateManager.on('stateChanged', (state) => {
      if (state.timer && state.timer.isActive && !this.interval) {
        // Timer was started, begin ticking
        this.startTicking();
      } else if ((!state.timer || !state.timer.isActive) && this.interval) {
        // Timer was stopped, clear interval
        this.stopTicking();
      }
    });

    // Listen to timer expiration
    this.stateManager.on('timerExpired', () => {
      this.stopTicking();
      logger.info('Timer expired!');
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  /**
   * Start the tick interval (1 second)
   */
  private startTicking(): void {
    if (this.interval) {
      return; // Already ticking
    }

    logger.info('Timer ticking started');
    this.interval = setInterval(() => {
      this.tick();
    }, 1000); // Tick every 1 second
  }

  /**
   * Stop the tick interval
   */
  private stopTicking(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Timer ticking stopped');
    }
  }

  /**
   * Execute one timer tick
   */
  private tick(): void {
    const result = this.stateManager.tickTimer();

    if (!result.success) {
      // Timer was stopped or invalid, clear interval
      this.stopTicking();
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.stopTicking();
  }
}
