import crypto from "crypto";

/**
 * Auto-generate nilai default untuk secret jika tidak di-set.
 * Di production (Vercel), nilai dari environment variable SELALU dipakai.
 * Di local dev, nilai di-generate otomatis sehingga tidak perlu .env sama sekali.
 */
function autoSecret(envKey: string, length = 48): string {
  const val = process.env[envKey];
  if (val && val.trim().length > 0) return val.trim();
  // Generate deterministik berdasarkan nama key + machine-id supaya
  // tidak berubah setiap restart saat dev
  return crypto.createHash("sha256").update(`auto-${envKey}-dev`).digest("hex").slice(0, length);
}

export const ENV = {
  // JSONBin.io — WAJIB diisi di Vercel
  jsonbinApiKey: process.env.JSONBIN_API_KEY ?? "",
  jsonbinBinId:  process.env.JSONBIN_BIN_ID  ?? "",

  // OAuth Manus — WAJIB diisi di Vercel
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId:    process.env.OWNER_OPEN_ID    ?? "",
  appId:          process.env.VITE_APP_ID      ?? "",

  // Auto-generate di dev jika tidak di-set
  cookieSecret: autoSecret("JWT_SECRET"),

  isProduction: process.env.NODE_ENV === "production",
};
