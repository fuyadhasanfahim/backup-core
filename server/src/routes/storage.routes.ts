import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { storageService } from "../services/storage.service";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/storage
 * Get current disk usage
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const info = await storageService.getStorageInfo();
    res.json(info);
  } catch (error) {
    logger.error("Get storage error:", error);
    res.status(500).json({ error: "Failed to get storage info" });
  }
});

/**
 * GET /api/storage/history
 * Get storage usage history for charts
 */
router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await storageService.getStorageHistory(days);
    res.json(history);
  } catch (error) {
    logger.error("Get storage history error:", error);
    res.status(500).json({ error: "Failed to get storage history" });
  }
});

/**
 * POST /api/storage/snapshot
 * Save current storage snapshot (can be called by cron)
 */
router.post("/snapshot", authMiddleware, async (req: Request, res: Response) => {
  try {
    const snapshot = await storageService.saveSnapshot();
    res.json(snapshot);
  } catch (error) {
    logger.error("Save snapshot error:", error);
    res.status(500).json({ error: "Failed to save snapshot" });
  }
});

export default router;
