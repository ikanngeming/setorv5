# Deploy ke Vercel

## Perubahan yang dilakukan

Proyek ini sudah dimodifikasi agar bisa jalan di Vercel. Berikut ringkasan perubahannya:

| File | Perubahan |
|------|-----------|
| `vercel.json` | ✅ Baru — konfigurasi routing & build |
| `api/trpc.ts` | ✅ Baru — tRPC handler sebagai serverless function |
| `api/oauth.ts` | ✅ Baru — OAuth callback sebagai serverless function |
| `api/csrf.ts` | ✅ Baru — CSRF token endpoint |
| `api/storage.ts` | ✅ Baru — storage proxy |
| `vite.config.ts` | ✅ Diupdate — hapus plugin Manus, allowedHosts untuk Vercel |
| `package.json` | ✅ Diupdate — tambah `build:vercel` script & `@vercel/node` |
| `.env.example` | ✅ Baru — template environment variables |

## Cara Deploy

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Set Environment Variables di Vercel Dashboard
Masuk ke **Project Settings → Environment Variables** dan tambahkan semua variabel dari `.env.example`:
- `DATABASE_URL`
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `VITE_APP_ID`
- `BUILT_IN_FORGE_API_URL` (opsional)
- `BUILT_IN_FORGE_API_KEY` (opsional)

### 3. Deploy
```bash
vercel
```

Atau push ke GitHub dan connect repo di [vercel.com](https://vercel.com).

## Arsitektur di Vercel

```
Vercel Edge
├── /api/trpc         → api/trpc.ts      (tRPC semua endpoint)
├── /api/oauth/*      → api/oauth.ts     (OAuth callback)
├── /api/csrf-token   → api/csrf.ts      (CSRF token)
├── /manus-storage/*  → api/storage.ts   (Storage proxy)
└── /*                → dist/public/     (React SPA static)
```

## Catatan Penting

- **Database**: Vercel functions adalah serverless, pastikan DB mendukung koneksi singkat (PlanetScale, Railway, Supabase, dsb). Untuk MySQL biasa, pertimbangkan menambahkan `connectTimeout` di connection string.
- **Rate limiting**: `antiScraping.ts` menggunakan in-memory store — ini **tidak persistent** di serverless. Untuk production, ganti dengan Redis (Upstash) atau Vercel KV.
- **CSRF store**: Sama seperti rate limit, token CSRF tersimpan in-memory. Pertimbangkan persistent store jika perlu.
