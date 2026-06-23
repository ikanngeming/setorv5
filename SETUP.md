# 🚀 Panduan Deploy ke Vercel

## Yang perlu disiapkan (hanya 2 hal)

### 1. JSONBin.io (Database)

1. Buat akun gratis di **https://jsonbin.io**
2. Masuk ke **Dashboard → API Keys** → copy nilai **Secret Key**  
   → ini adalah `JSONBIN_API_KEY`
3. Klik **Create Bin** → isi content dengan `{}` → Save  
4. Lihat URL bin kamu: `https://jsonbin.io/app/bins/XXXXXXXX`  
   → angka/huruf di akhir URL itu adalah `JSONBIN_BIN_ID`

### 2. Deploy ke Vercel

```bash
# Install Vercel CLI (sekali saja)
npm i -g vercel

# Deploy
vercel
```

Atau push ke GitHub → connect di [vercel.com/new](https://vercel.com/new)

### 3. Set Environment Variables di Vercel Dashboard

Masuk ke **Project → Settings → Environment Variables**, tambahkan:

| Variable | Nilai | Keterangan |
|---|---|---|
| `JSONBIN_API_KEY` | `$2a$10$...` | Secret key dari JSONBin |
| `JSONBIN_BIN_ID` | `64a1b2...` | ID bin dari JSONBin |
| `OAUTH_SERVER_URL` | `https://...` | URL OAuth server Manus |
| `OWNER_OPEN_ID` | `...` | Open ID pemilik akun |

> ✅ Variabel lain (`JWT_SECRET`, `VITE_APP_ID`, dll) **tidak perlu diisi** — akan di-generate otomatis.

---

## Arsitektur

```
Vercel
├── /api/trpc/*        → Express + tRPC (semua endpoint data)
├── /api/oauth/callback → OAuth callback handler
├── /api/csrf-token    → CSRF token
└── /*                 → React SPA (static)

Database
└── JSONBin.io         → Satu file JSON persistent
                         (users, emails, deposits, notifications, broadcasts)
```

## User pertama = Admin otomatis

User yang pertama kali login akan otomatis mendapat role **admin**.
