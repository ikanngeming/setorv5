import type { CookieOptions, Request } from "express";

// Di Vercel serverless, req.protocol selalu "http" karena TLS di-terminate
// oleh Vercel edge. Gunakan x-forwarded-proto sebagai sumber kebenaran.
function isSecureRequest(req: Request): boolean {
  const forwarded = req.headers["x-forwarded-proto"];
  if (forwarded) {
    const proto = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return proto.trim().toLowerCase() === "https";
  }
  return req.protocol === "https";
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // sameSite "none" hanya valid kalau secure=true.
    // Kalau tidak secure (local dev), pakai "lax".
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
