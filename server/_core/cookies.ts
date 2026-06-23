import type { CookieOptions, Request } from "express";

/**
 * Di Vercel, TLS di-terminate di edge sehingga req.protocol selalu "http".
 * Gunakan x-forwarded-proto sebagai sumber kebenaran.
 */
function isSecureRequest(req: Request): boolean {
  const forwarded = req.headers["x-forwarded-proto"];
  if (forwarded) {
    const proto = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    if (proto.trim().toLowerCase() === "https") return true;
  }
  return req.protocol === "https";
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // sameSite "none" hanya valid kalau secure=true (browser menolak kombinasi lain)
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
