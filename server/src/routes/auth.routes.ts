import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate with username/password → returns JWT
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Validate credentials
    if (username !== config.adminUsername) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, config.adminPasswordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { username: config.adminUsername },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logger.info(`Admin logged in: ${username}`);

    res.json({
      token,
      user: { username: config.adminUsername },
      expiresIn: config.jwtExpiresIn,
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/logout
 * Client-side logout (just acknowledges)
 */
router.post("/logout", authMiddleware, (req: AuthRequest, res: Response) => {
  logger.info(`Admin logged out: ${req.user?.username}`);
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
