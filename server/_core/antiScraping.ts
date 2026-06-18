import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Rate limiting store (IP -> { count, resetTime })
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per minute

// CSRF token store (token -> { createdAt })
const csrfTokenStore = new Map<string, { createdAt: number }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 jam

// Blocked user agents (common scrapers)
const BLOCKED_USER_AGENTS = [
  "bot",
  "crawler",
  "spider",
  "scraper",
  "curl",
  "wget",
  "python",
  "java",
  "node",
  "perl",
  "ruby",
];

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let limitData = rateLimitStore.get(ip);

  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitStore.set(ip, limitData);
  }

  limitData.count++;

  if (limitData.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil((limitData.resetTime - now) / 1000),
    });
  }

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", RATE_LIMIT_MAX_REQUESTS - limitData.count);
  res.setHeader("X-RateLimit-Reset", limitData.resetTime);

  next();
}

/**
 * User-agent filtering middleware
 */
export function userAgentFilterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userAgent = (req.get("user-agent") || "").toLowerCase();

  for (const blocked of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(blocked)) {
      return res.status(403).json({
        error: "Access denied",
      });
    }
  }

  next();
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  csrfTokenStore.set(token, { createdAt: Date.now() });

  // Cleanup expired tokens
  csrfTokenStore.forEach((value, key) => {
    if (Date.now() - value.createdAt > CSRF_TOKEN_EXPIRY) {
      csrfTokenStore.delete(key);
    }
  });

  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  const tokenData = csrfTokenStore.get(token);

  if (!tokenData) {
    return false;
  }

  // Check if token is expired
  if (Date.now() - tokenData.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfTokenStore.delete(token);
    return false;
  }

  // Token is valid, remove it (one-time use)
  csrfTokenStore.delete(token);
  return true;
}

/**
 * CSRF protection middleware
 */
export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // GET requests don't need CSRF protection
  if (req.method === "GET") {
    return next();
  }

  const token = req.get("x-csrf-token") || req.body?.csrfToken;

  if (!token || !verifyCSRFToken(token)) {
    return res.status(403).json({
      error: "CSRF token invalid or missing",
    });
  }

  next();
}

/**
 * Honeypot field validation
 * Add a hidden field to forms that bots might fill
 */
export function validateHoneypot(data: Record<string, any>): boolean {
  // Honeypot field should always be empty
  const honeypotValue = data.website;
  if (!honeypotValue) return false; // Empty/null/undefined is OK
  if (typeof honeypotValue !== 'string') return false;
  return honeypotValue.trim() !== ""; // True if honeypot is filled (bot detected)
}

/**
 * Request validation middleware - checks for suspicious patterns
 */
export function requestValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check for suspicious headers
  const referer = req.get("referer") || "";
  const origin = req.get("origin") || "";

  // If origin/referer is set, it should match the host
  const host = req.get("host") || "";
  if (origin && !origin.includes(host)) {
    // Allow for development/testing
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Invalid origin",
      });
    }
  }

  // Check for suspicious content-type
  const contentType = req.get("content-type") || "";
  if (
    req.method !== "GET" &&
    !contentType.includes("application/json") &&
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return res.status(400).json({
      error: "Invalid content type",
    });
  }

  next();
}

/**
 * Input sanitization - remove potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>\"']/g, "") // Remove HTML/XML special chars
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Cleanup rate limit store periodically
 */
export function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((data, ip) => {
      if (now > data.resetTime) {
        rateLimitStore.delete(ip);
      }
    });
  }, 5 * 60 * 1000); // Cleanup every 5 minutes
}
