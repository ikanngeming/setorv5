import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateCSRFToken } from "../server/_core/antiScraping";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const token = generateCSRFToken();
  res.json({ token });
}
