import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerOAuthRoutes } from "../server/_core/oauth";

const app = express();

// Trust Vercel proxy — wajib agar isSecureRequest() di cookies.ts baca
// x-forwarded-proto dengan benar dan set cookie dengan secure:true
app.set("trust proxy", 1);

app.use(express.json());

// Parse cookies
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(rest.join("="));
  });
  (req as any).cookies = cookies;
  next();
});

registerOAuthRoutes(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
