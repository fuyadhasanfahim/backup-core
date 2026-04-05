import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { settingsService } from "../services/settings.service";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/settings
 * Returns all settings merged: DB values override ENV defaults.
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const merged = await settingsService.getAll();

    // Return as array of { key, value } for the frontend
    const result = Object.entries(merged).map(([key, value]) => ({
      key,
      value,
    }));

    res.json(result);
  } catch (error) {
    logger.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * PUT /api/settings
 * Accepts a flat object { key: value, ... } and upserts each into the DB.
 */
router.put("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const updates: Record<string, string> = req.body;

    if (!updates || typeof updates !== "object") {
      res.status(400).json({ error: "Request body must be a JSON object of key-value pairs" });
      return;
    }

    await settingsService.update(updates);

    // Return the full updated settings list
    const merged = await settingsService.getAll();
    const result = Object.entries(merged).map(([key, value]) => ({
      key,
      value,
    }));

    res.json(result);
  } catch (error) {
    logger.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
