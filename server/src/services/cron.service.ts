import cron from "node-cron";
import { backupService } from "./backup.service";
import { storageService } from "./storage.service";
import logger from "../utils/logger";
import { config } from "../config/env";

export class CronService {
  /**
   * Initialize cron jobs
   */
  init() {
    // Take a storage snapshot on startup to seed initial data
    this.takeStorageSnapshot();

    // Scheduled backup: everyday at 2:00 AM
    cron.schedule("0 2 * * *", async () => {
      logger.info("⏰ Scheduled backup task started (2:00 AM)...");
      try {
        const result = await backupService.triggerBackup();
        logger.info(`✅ Scheduled backup triggered. Message: ${result.message}`);
      } catch (error) {
        logger.error(`❌ Failed to trigger scheduled backup: ${(error as Error).message}`);
      }

      // Take a snapshot after each backup
      await this.takeStorageSnapshot();
    });

    // Storage snapshot: every 6 hours to track trends
    cron.schedule("0 */6 * * *", async () => {
      await this.takeStorageSnapshot();
    });

    logger.info("📂 Cron service initialized (2:00 AM daily backup, 6h storage snapshots)");
  }

  /**
   * Take a storage snapshot and persist to DB
   */
  private async takeStorageSnapshot() {
    try {
      logger.info("📊 Taking storage snapshot...");
      const snapshot = await storageService.saveSnapshot();
      logger.info(`✅ Storage snapshot saved: ${snapshot.usedGB.toFixed(1)} GB used, ${snapshot.backupGB.toFixed(2)} GB backups`);
    } catch (error) {
      logger.error(`❌ Failed to take storage snapshot: ${(error as Error).message}`);
    }
  }
}

export const cronService = new CronService();
