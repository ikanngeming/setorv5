import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// Trust Vercel's proxy so req.protocol dan req.ip terbaca benar
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Parse cookies dari header
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

app.use(
  "/",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error in ${path}:`, error);
    },
  })
);

export default function handler(req: VercelRequest, res: VercelResponse) {
  req.url = req.url?.replace(/^\/api\/trpc/, "") || "/";
  return app(req as any, res as any);
}
