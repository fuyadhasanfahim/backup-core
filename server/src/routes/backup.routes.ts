import { Router, Request, Response } from "express";
import { authMiddleware, apiKeyMiddleware } from "../middleware/auth";
import { backupService } from "../services/backup.service";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/backups
 * List all backups (paginated)
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await backupService.getBackups(page, limit, status);
    res.json(result);
  } catch (error) {
    logger.error("Get backups error:", error);
    res.status(500).json({ error: "Failed to fetch backups" });
  }
});

/**
 * GET /api/backups/stats
 * Get backup statistics (for dashboard)
 */
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await backupService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/backups/:id
 * Get single backup details
 */
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const backupId = req.params.id as string;
    const backup = await backupService.getBackup(backupId);
    if (!backup) {
      res.status(404).json({ error: "Backup not found" });
      return;
    }
    res.json(backup);
  } catch (error) {
    logger.error("Get backup error:", error);
    res.status(500).json({ error: "Failed to fetch backup" });
  }
});

/**
 * POST /api/backups/trigger
 * Trigger a manual backup
 */
router.post("/trigger", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await backupService.triggerBackup();
    res.json(result);
  } catch (error: any) {
    logger.error("Trigger backup error:", error);
    res.status(500).json({ error: error.message || "Failed to trigger backup" });
  }
});

/**
 * POST /api/backups/log
 * Log a backup result (called by backup.sh via API key)
 */
router.post("/log", apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const backup = await backupService.logBackup(req.body);
    logger.info(`Backup logged: ${backup.id} - ${backup.status}`);
    res.json(backup);
  } catch (error) {
    logger.error("Log backup error:", error);
    res.status(500).json({ error: "Failed to log backup" });
  }
});

/**
 * DELETE /api/backups/:id
 * Delete a backup (file + record)
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const backupId = req.params.id as string;
    const result = await backupService.deleteBackup(backupId);
    res.json(result);
  } catch (error: any) {
    logger.error("Delete backup error:", error);
    res.status(500).json({ error: error.message || "Failed to delete backup" });
  }
});

/**
 * POST /api/backups/:id/restore
 * Trigger restore from a backup
 */
router.post("/:id/restore", authMiddleware, async (req: Request, res: Response) => {
  try {
    const backupId = req.params.id as string;
    const result = await backupService.restoreBackup(backupId);
    res.json(result);
  } catch (error: any) {
    logger.error("Restore error:", error);
    res.status(500).json({ error: error.message || "Failed to trigger restore" });
  }
});

export default router;
