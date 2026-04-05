import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Resolve the root directory (backup-core)
const ROOT_DIR = path.resolve(__dirname, "../../../");
const envPath = path.join(ROOT_DIR, ".env");

// Load .env from project root
dotenv.config({ path: envPath });

if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn("⚠️  [Config] ADMIN_PASSWORD_HASH is missing after loading .env");
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Auth
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",

  // API Key (for script → API communication)
  apiKey: process.env.API_KEY || "",

  // Backup
  backupDir: process.env.BACKUP_DIR || "/backups",

  // Cloud Sync
  rcloneRemote: process.env.RCLONE_REMOTE || "",
  rclonePath: process.env.RCLONE_PATH || "backups/",

  // Email Notifications (SMTP)
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: parseInt(process.env.SMTP_PORT || "587"),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  fromEmail: process.env.FROM_EMAIL || "backups@backendsafe.com",
  adminEmail: process.env.ADMIN_EMAIL || "",

  // Paths
  backupScriptPath: process.env.BACKUP_SCRIPT_PATH || path.join(ROOT_DIR, "scripts/backup.sh"),
  restoreScriptPath: process.env.RESTORE_SCRIPT_PATH || path.join(ROOT_DIR, "scripts/restore.sh"),

  // Dashboard
  dashboardUrl: process.env.DASHBOARD_URL || "http://localhost:3000",

  // MongoDB
  mongoDbName: process.env.MONGO_DB_NAME || "",
};
