import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Mock cookie parser (sama seperti di api/trpc.ts)
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

// tRPC endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files di production
if (process.env.NODE_ENV === "production") {
  const publicPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(publicPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).end();
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
