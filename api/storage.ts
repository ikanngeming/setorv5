import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ENV } from "../server/_core/env";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract key from /api/storage or /manus-storage/... paths
  const url = req.url || "";
  const key = url
    .replace(/^\/api\/storage/, "")
    .replace(/^\/manus-storage/, "")
    .replace(/^\//, "");

  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }

  try {
    const forgeUrl = new URL(
      "v1/storage/presign/get",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
    );
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl.toString(), {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(502).send("Storage backend error");
      return;
    }

    const { url: signedUrl } = (await forgeResp.json()) as { url: string };
    if (!signedUrl) {
      res.status(502).send("Empty signed URL from backend");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.redirect(307, signedUrl);
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    res.status(502).send("Storage proxy error");
  }
}
