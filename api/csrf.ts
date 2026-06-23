import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const token = crypto.randomBytes(32).toString("hex");
  res.json({ token });
}
