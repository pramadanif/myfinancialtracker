# Finance Tracker — Deploy ke Vercel (Tanpa VPS)

Panduan hosting Finance Tracker **tanpa VPS**: Next.js di **Vercel** + database **Neon Postgres** (serverless). Gratis (Vercel Hobby + Neon free tier), auto-HTTPS, auto-deploy dari GitHub.

> Kenapa bukan SQLite? Filesystem Vercel bersifat *ephemeral* (hilang tiap request/redeploy), jadi file `.db` tidak bisa dipakai. Solusinya database hosted. Karena app ini tidak memakai raw SQL, logika 1.100+ baris di `lib/transactions.ts` **tidak perlu diubah** — Prisma yang bicara ke Postgres.
>
> Kenapa bukan Excel sebagai DB? Alasan yang sama (ephemeral) + tidak ada transaksi atomik/relasi/agregasi. Excel di app ini tetap dipakai untuk **import/export** (`scripts/import-excel.mjs`), bukan sebagai database.

---

## Arsitektur

```
Browser / iPhone PWA
        │  (HTTPS otomatis Vercel)
        ▼
Vercel (Next.js 14 — SSR + API routes)
        │  Prisma (pooled connection)
        ▼
Neon Postgres (serverless, ap-southeast-1 / Singapore)

Notifikasi terjadwal:
  cron-job.org (tiap jam)  ──POST──▶  /api/cron/notifications  (Bearer CRON_SECRET)
  Vercel Cron (1x/hari)    ──GET───▶  /api/cron/notifications  (baseline, dari vercel.json)
```

---

## Prasyarat

- Akun **GitHub** (repo sudah di-push).
- Akun **Vercel** (login pakai GitHub).
- Akun **Neon** (login pakai GitHub) — atau buat via Vercel Storage.

---

## 1. Siapkan database Neon

Dua cara — pilih salah satu:

**Cara A (paling gampang): lewat Vercel Storage**
1. Buat/import project di Vercel dulu (lihat langkah 2), lalu buka tab **Storage → Create Database → Neon (Postgres)**.
2. Pilih region **Singapore (ap-southeast-1)**.
3. Vercel otomatis meng-inject `DATABASE_URL` & `DIRECT_URL` (kadang bernama `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` — lihat catatan di bawah).

**Cara B: langsung di Neon**
1. Buka [neon.tech](https://neon.tech) → New Project → region Singapore.
2. Di halaman **Connection Details**, salin dua connection string:
   - **Pooled** (host ada `-pooler`) → jadi `DATABASE_URL`
   - **Direct** (tanpa `-pooler`) → jadi `DIRECT_URL`

> **Catatan penamaan env:** integrasi Vercel-Neon kadang membuat `POSTGRES_PRISMA_URL` (pooled) dan `POSTGRES_URL_NON_POOLING` (direct). Kalau begitu, tambahkan dua env alias: `DATABASE_URL = $POSTGRES_PRISMA_URL` dan `DIRECT_URL = $POSTGRES_URL_NON_POOLING`, atau cukup copy nilainya ke `DATABASE_URL`/`DIRECT_URL`.

---

## 2. Import project ke Vercel

1. [vercel.com/new](https://vercel.com/new) → pilih repo `myfinancialtracker`.
2. Framework **Next.js** (auto-detect). Build command & output biarkan default.
3. **Jangan deploy dulu** — set Environment Variables di langkah 3.

---

## 3. Set Environment Variables di Vercel

Project → **Settings → Environment Variables** (scope: Production + Preview). Isi:

| Variable | Nilai |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** connection string (host `-pooler`) |
| `DIRECT_URL` | Neon **direct** connection string |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `APP_PIN` | PIN 6 digit login-mu |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `VAPID_PUBLIC_KEY` | dari `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | dari perintah yang sama |
| `VAPID_SUBJECT` | `mailto:email-kamu@domain.com` |
| `APP_URL` | `https://nama-app.vercel.app` (isi setelah tahu domain-nya) |
| `APP_TIMEZONE` | `Asia/Jakarta` |

Generate secret di laptop:
```bash
openssl rand -base64 32           # SESSION_SECRET
openssl rand -base64 32           # CRON_SECRET
npx web-push generate-vapid-keys  # VAPID public & private
```

---

## 4. Buat tabel + seed database (sekali saja)

Migrasi lama berbasis SQLite sudah dihapus (tidak kompatibel Postgres). Untuk membuat skema di Neon, jalankan **dari laptop** dengan `.env` yang berisi URL Neon:

```bash
# .env lokal harus berisi DATABASE_URL & DIRECT_URL Neon (lihat .env.example)
npx prisma db push      # buat semua tabel dari schema.prisma
npm run db:seed         # isi akun & kategori default (HANYA sekali)
```

> `prisma db push` dipakai (bukan `migrate`) karena app ini single-user dan tidak butuh riwayat migrasi. Kalau nanti mau migrasi terversi, jalankan `npx prisma migrate dev --name init` terhadap Neon lalu commit foldernya.

---

## 5. Deploy

Klik **Deploy** di Vercel (atau `git push` — auto-deploy). Build menjalankan `prisma generate && next build`.

Setelah live:
1. Salin domain (`https://nama-app.vercel.app`), update env `APP_URL` ke domain itu, lalu **Redeploy** sekali (agar push notification & cron pakai URL benar).
2. Buka domain → halaman login muncul → login pakai `APP_PIN`.

---

## 6. Notifikasi terjadwal

Endpoint `/api/cron/notifications` menerima **GET** (Vercel Cron) dan **POST** (cron eksternal), keduanya butuh header `Authorization: Bearer <CRON_SECRET>`.

**Baseline (sudah otomatis):** `vercel.json` menjalankan cron **1x/hari jam 13:00 UTC (20:00 WIB)**. Vercel otomatis mengirim header `Bearer $CRON_SECRET`. Ini batas paket **Hobby** (maksimal 1 cron/hari).

**Full (disarankan, gratis):** untuk reminder harian di jam custom, alert budget, dan ringkasan mingguan yang akurat, pakai cron eksternal **tiap jam**:
1. Daftar di [cron-job.org](https://cron-job.org) (gratis).
2. Buat job:
   - URL: `https://nama-app.vercel.app/api/cron/notifications`
   - Method: **POST**
   - Header: `Authorization: Bearer <CRON_SECRET>`
   - Schedule: **every hour** (`0 * * * *`)
3. Logika notifikasi sendiri yang memutuskan kapan benar-benar mengirim (cek jam & anti-duplikat), jadi dipanggil tiap jam aman.

Tes manual:
```bash
curl -X POST https://nama-app.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer <CRON_SECRET>"
# harus {"ok":true,...}
```

---

## 7. Update / Redeploy

Cukup `git push` ke branch production → Vercel auto-build & deploy. Kalau ada perubahan schema:
```bash
npx prisma db push     # dari laptop, terhadap Neon
git push               # deploy kode
```

---

## 8. Backup database

Tidak ada file `.db` lagi. Backup lewat Neon:
- Neon punya **point-in-time restore** (free tier: history 24 jam).
- Backup manual kapan saja:
  ```bash
  pg_dump "$DIRECT_URL" > backup_$(date +%F).sql
  ```
- Atau export via dashboard Neon.

---

## 9. Development lokal

`.env` lokal sekarang butuh Postgres (bukan SQLite lagi). Dua opsi:
- **Pakai Neon dev branch:** buat branch DB terpisah di Neon untuk dev, isi URL-nya di `.env` lokal.
- **Postgres lokal:** `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`, lalu `DATABASE_URL`/`DIRECT_URL` = `postgresql://postgres:dev@localhost:5432/postgres`, jalankan `npx prisma db push && npm run db:seed`.

---

## Checklist

- [ ] Neon Postgres dibuat (region Singapore)
- [ ] `DATABASE_URL` (pooled) & `DIRECT_URL` (direct) di-set di Vercel
- [ ] Semua env lain di-set (SESSION_SECRET, APP_PIN, CRON_SECRET, VAPID, APP_URL, APP_TIMEZONE)
- [ ] `prisma db push` + `db:seed` sudah dijalankan (tabel + data default ada)
- [ ] Deploy sukses, login pakai APP_PIN berhasil
- [ ] `APP_URL` di-set ke domain Vercel + redeploy
- [ ] Cron eksternal (cron-job.org) tiap jam terpasang & tes `curl` mengembalikan `ok:true`
- [ ] PWA: Add to Home Screen di iPhone jalan
- [ ] Push notification tes (`/api/push/test`) diterima

---

**Perbandingan singkat dengan VPS:** tidak perlu urus user/SSH/nginx/SSL/PM2, HTTPS & scaling otomatis, deploy = `git push`. Trade-off: DB pindah ke Neon (bukan file lokal), dan cron granular butuh layanan eksternal gratis. Untuk app single-user seperti ini, Vercel lebih ringkas dan bisa Rp0.
