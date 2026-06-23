import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.set("trust proxy", 1); // wajib agar x-forwarded-proto terbaca

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Parse cookies dari header Cookie
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

app.use(
  "/",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC] ${path}:`, error.message);
    },
  })
);

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Hapus prefix /api/trpc supaya tRPC dapat path procedure yang benar
  req.url = req.url?.replace(/^\/api\/trpc/, "") || "/";
  return app(req as any, res as any);
}
