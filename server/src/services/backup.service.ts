import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";
import { settingsService } from "./settings.service";
import logger from "../utils/logger";
import { emailService } from "./email.service";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export class BackupService {
  /**
   * Get paginated list of backups
   */
  async getBackups(page: number = 1, limit: number = 20, status?: string) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.backup.count({ where }),
    ]);

    return {
      backups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single backup by ID
   */
  async getBackup(id: string) {
    return prisma.backup.findUnique({ where: { id } });
  }

  /**
   * Log a backup result (called by backup.sh script)
   */
  async logBackup(data: {
    id?: string;
    date: string;
    dbName: string;
    size: string;
    status: string;
    filePath: string;
    duration?: number;
    cloudSync?: boolean;
    errorMsg?: string;
  }) {
    let backup;

    if (data.id) {
      try {
        backup = await prisma.backup.update({
          where: { id: data.id },
          data: {
            size: data.size,
            status: data.status,
            filePath: data.filePath || "",
            duration: data.duration || null,
            cloudSync: data.cloudSync || false,
            errorMsg: data.errorMsg || null,
          },
        });
      } catch (err) {
        logger.warn(`Could not update backup ${data.id}, creating new one instead.`);
      }
    }

    if (!backup) {
      backup = await prisma.backup.create({
        data: {
          date: new Date(data.date),
          dbName: data.dbName,
          size: data.size,
          status: data.status,
          filePath: data.filePath || "",
          duration: data.duration || null,
          cloudSync: data.cloudSync || false,
          errorMsg: data.errorMsg || null,
        },
      });
    }

    // Send email alert on failure
    if (data.status === "failed") {
      await emailService.sendFailureAlert({
        dbName: data.dbName,
        error: data.errorMsg || "Unknown error logged in script",
        date: new Date(),
        duration: data.duration,
      });
    }

    return backup;
  }

  /**
   * Trigger a manual backup
   * - Uses dynamic settings for MONGO_DB_NAME, RCLONE_REMOTE, etc.
   * - Dynamically generates rclone.conf for cloud sync
   */
  async triggerBackup(): Promise<{ message: string; backupId: string }> {
    const settings = await settingsService.getAll();
    const dbName = settings.mongo_db || "all";

    // Create in_progress record
    const backup = await prisma.backup.create({
      data: {
        date: new Date(),
        dbName: dbName,
        size: "0 B",
        status: "in_progress",
        filePath: "",
      },
    });

    logger.info(`Manual backup triggered: ${backup.id} for database: ${dbName}`);

    const scriptPath = config.backupScriptPath;
    const isWindows = process.platform === "win32";

    // --- Dynamic Rclone Configuration ---
    let rcloneConfigPath = "";
    const remoteName = settings.rclone_remote || "nextcloud";
    
    if (!isWindows && settings.rclone_host && settings.rclone_user && settings.rclone_pass) {
      try {
        // Generate dynamic rclone.conf content
        const rcloneConfContent = `
[${remoteName}]
type = webdav
url = ${settings.rclone_host}
vendor = nextcloud
user = ${settings.rclone_user}
pass = ${settings.rclone_pass}
`.trim();

        // Save to temporary file
        rcloneConfigPath = "/tmp/rclone.conf";
        fs.writeFileSync(rcloneConfigPath, rcloneConfContent);
        logger.info(`✅ Dynamic rclone configuration generated at ${rcloneConfigPath}`);
      } catch (err) {
        logger.error(`❌ Failed to generate dynamic rclone config: ${err}`);
      }
    }

    // Prepare environment variables from dynamic settings
    const dynamicEnv = {
      ...process.env,
      MONGO_DB_NAME: dbName === "all" ? "" : dbName,
      RCLONE_REMOTE: remoteName,
      RCLONE_PATH: settings.rclone_path || "backups/",
      RETENTION_DAYS: settings.retention_days || "7",
      API_URL: process.env.API_URL || `http://localhost:${config.port}`,
      API_KEY: config.apiKey,
      BACKUP_ID: backup.id,
      BACKUP_DIR: config.backupDir,
      MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017"
    };

    // If we have a dynamic config, pass it to rclone via environment variable
    if (rcloneConfigPath) {
      (dynamicEnv as any).RCLONE_CONFIG = rcloneConfigPath;
    }

    if (!isWindows && fs.existsSync(scriptPath)) {
      this.runBashBackup(backup.id, scriptPath, dynamicEnv);
    } else if (isWindows) {
      this.runDirectBackup(backup.id, settings);
    } else {
      const errorMsg = `Backup script not found: ${scriptPath}`;
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: "failed", errorMsg },
      });

      await emailService.sendFailureAlert({
        dbName: dbName,
        error: errorMsg,
        date: new Date(),
      });

      throw new Error(errorMsg);
    }

    return {
      message: "Backup started",
      backupId: backup.id,
    };
  }

  /**
   * Run backup via bash script (production / Docker) with dynamic env vars
   */
  private runBashBackup(backupId: string, scriptPath: string, env: any) {
    const child = spawn("bash", [scriptPath], {
      detached: true,
      stdio: "pipe", // Capture output
      env: env,
    });

    child.stdout?.on("data", (data) => {
      logger.info(`[Backup Script]: ${data.toString().trim()}`);
    });

    child.stderr?.on("data", (data) => {
      logger.error(`[Backup Script Error]: ${data.toString().trim()}`);
    });

    child.unref();

    child.on("error", async (error) => {
      logger.error(`Backup script error: ${error.message}`);
      const backup = await prisma.backup.findUnique({ where: { id: backupId } });
      
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: "failed",
          errorMsg: error.message,
        },
      });

      await emailService.sendFailureAlert({
        dbName: backup?.dbName || "unknown",
        error: error.message,
        date: new Date(),
      });
    });
  }

  /**
   * Run backup directly via mongodump (Windows dev fallback) with dynamic settings
   */
  private async runDirectBackup(backupId: string, settings: Record<string, string>) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `backup-${timestamp}`;
    const dumpDir = path.join(config.backupDir, name);
    const dbName = settings.mongo_db || "";

    try {
      fs.mkdirSync(config.backupDir, { recursive: true });

      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
      const dbFlag = dbName ? `--db="${dbName}"` : "";
      
      logger.info(`📦 Running direct mongodump to ${dumpDir}...`);
      await execAsync(`mongodump --uri="${mongoUri}" ${dbFlag} --out="${dumpDir}"`);

      let sizeStr = "0 B";
      try {
        const { stdout } = await execAsync(
          `powershell -Command "(Get-ChildItem -Path '${dumpDir}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`
        );
        const bytes = parseInt(stdout.trim() || "0", 10);
        if (bytes >= 1073741824) sizeStr = `${(bytes / 1073741824).toFixed(2)} GB`;
        else if (bytes >= 1048576) sizeStr = `${(bytes / 1048576).toFixed(2)} MB`;
        else if (bytes >= 1024) sizeStr = `${(bytes / 1024).toFixed(2)} KB`;
        else sizeStr = `${bytes} B`;
      } catch { /* ... */ }

      const duration = Math.round((Date.now() - startTime) / 1000);

      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: "success",
          size: sizeStr,
          filePath: dumpDir,
          duration,
          cloudSync: false,
        },
      });

      logger.info(`✅ Direct backup completed: ${sizeStr} in ${duration}s`);
    } catch (error: any) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const errorMsg = error.message || "Unknown error during direct backup";

      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: "failed",
          errorMsg: errorMsg,
          duration,
        },
      });

      await emailService.sendFailureAlert({
        dbName: dbName || "all",
        error: errorMsg,
        date: new Date(),
        duration,
      });

      logger.error(`❌ Direct backup failed: ${errorMsg}`);
    }
  }

  /**
   * Delete a backup (file + DB record)
   */
  async deleteBackup(id: string) {
    const backup = await prisma.backup.findUnique({ where: { id } });

    if (!backup) {
      throw new Error("Backup not found");
    }

    if (backup.filePath) {
      try {
        if (fs.existsSync(backup.filePath)) {
          const stat = fs.statSync(backup.filePath);
          if (stat.isDirectory()) {
            fs.rmSync(backup.filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(backup.filePath);
          }
          logger.info(`Deleted backup file: ${backup.filePath}`);
        }
      } catch (err) {
        logger.warn(`Could not delete backup file: ${backup.filePath}`);
      }
    }

    await prisma.backup.delete({ where: { id } });
    logger.info(`Deleted backup record: ${id}`);

    return { message: "Backup deleted" };
  }

  /**
   * Trigger a restore from a backup
   */
  async restoreBackup(id: string): Promise<{ message: string }> {
    const backup = await prisma.backup.findUnique({ where: { id } });
    const settings = await settingsService.getAll();

    if (!backup) {
      throw new Error("Backup not found");
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      throw new Error("Backup file not found on disk");
    }

    const isWindows = process.platform === "win32";

    if (!isWindows) {
      const scriptPath = config.restoreScriptPath;

      if (!fs.existsSync(scriptPath)) {
        throw new Error("Restore script not found");
      }

      logger.info(`Restore triggered from backup: ${id}`);

      spawn("bash", [scriptPath, backup.filePath], {
        detached: true,
        stdio: "ignore",
        env: { 
          ...process.env, 
          SKIP_CONFIRM: "true",
          MONGO_DB_NAME: settings.mongo_db || "" 
        },
      }).unref();
    } else {
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
      const dbName = settings.mongo_db || "";
      const dbFlag = dbName ? `--db="${dbName}"` : "";
      const restorePath = dbName ? path.join(backup.filePath, dbName) : backup.filePath;

      logger.info(`Restore triggered (direct) from backup: ${id}`);

      execAsync(`mongorestore --uri="${mongoUri}" ${dbFlag} --drop "${restorePath}"`)
        .then(() => logger.info(`✅ Restore completed from backup: ${id}`))
        .catch((err) => logger.error(`❌ Restore failed: ${err.message}`));
    }

    return { message: "Restore started" };
  }

  /**
   * Get dashboard stats
   */
  async getStats() {
    const [total, successful, failed, lastBackup] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.count({ where: { status: "success" } }),
      prisma.backup.count({ where: { status: "failed" } }),
      prisma.backup.findFirst({ orderBy: { date: "desc" } }),
    ]);

    return {
      total,
      successful,
      failed,
      lastBackup,
    };
  }
}

export const backupService = new BackupService();
