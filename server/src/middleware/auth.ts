import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  user?: { username: string };
}

/**
 * JWT Authentication middleware
 * Checks Authorization header (Bearer token) or cookies
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Try Authorization header first
    let token = req.headers.authorization?.replace("Bearer ", "");

    // Fallback to cookie
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { username: string };
    req.user = { username: decoded.username };
    next();
  } catch (error) {
    logger.warn("Auth failed: Invalid token");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * API Key middleware (for script → API communication)
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  next();
}
