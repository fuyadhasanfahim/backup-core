import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import logger from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import backupRoutes from "./routes/backup.routes";
import storageRoutes from "./routes/storage.routes";
import settingsRoutes from "./routes/settings.routes";
import { cronService } from "./services/cron.service";

const app = express();
app.set("trust proxy", 1);

// --- Security Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: [config.dashboardUrl, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api", generalLimiter);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start Server ---
app.listen(config.port, () => {
  logger.info(`🚀 Backup Core API running on port ${config.port}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Dashboard URL: ${config.dashboardUrl}`);

  // Initialize background tasks
  cronService.init();
});

export default app;
