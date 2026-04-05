import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export class SettingsService {
  /**
   * Default settings base. 
   * These keys map to the ones used in the Dashboard UI.
   */
  private readonly DEFAULTS: Record<string, string> = {
    retention_days: process.env.RETENTION_DAYS || "7",
    cron_schedule: "0 2 * * *",
    mongo_db: config.mongoDbName || "",
    rclone_remote: config.rcloneRemote || "",
    rclone_path: config.rclonePath || "backups/",
    smtp_host: config.smtpHost || "",
    smtp_port: String(config.smtpPort || 587),
    smtp_user: config.smtpUser || "",
    smtp_pass: config.smtpHost ? config.smtpPass : "", // Only use pass if host is set
    from_email: config.fromEmail || "backups@backendsafe.com",
    admin_email: config.adminEmail || "",
  };

  /**
   * Get all settings merged with defaults.
   */
  async getAll(): Promise<Record<string, string>> {
    try {
      const dbSettings = await prisma.setting.findMany();
      const merged = { ...this.DEFAULTS };

      for (const setting of dbSettings) {
        merged[setting.key] = setting.value;
      }

      return merged;
    } catch (error) {
      logger.error("Error fetching settings from DB:", error);
      return this.DEFAULTS; // Fallback to defaults
    }
  }

  /**
   * Get a specific setting by key.
   */
  async get(key: string): Promise<string> {
    const all = await this.getAll();
    return all[key] || "";
  }

  /**
   * Update settings from a key-value object.
   */
  async update(updates: Record<string, string>) {
    const upserts = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(upserts);
    logger.info(`Settings updated: ${Object.keys(updates).join(", ")}`);
  }
}

export const settingsService = new SettingsService();
