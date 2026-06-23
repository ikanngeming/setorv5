import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerOAuthRoutes } from "../server/_core/oauth";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

// Parse cookies
app.use((req, _res, next) => {
  const raw = req.headers.cookie ?? "";
  const cookies: Record<string, string> = {};
  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(val);
  });
  (req as any).cookies = cookies;
  next();
});

registerOAuthRoutes(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  // vercel.json routes /api/oauth/callback → /api/oauth
  // Restore the original path so our express route matches
  req.url = "/api/oauth/callback";
  return app(req as any, res as any);
}
