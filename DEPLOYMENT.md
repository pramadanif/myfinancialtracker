# Finance Tracker — Deployment Guide (End-to-End)

Panduan deploy lengkap untuk VPS DigitalOcean Singapore (`ubuntu-s-2vcpu-4gb-sgp1-01`) dengan domain **`https://finance.pramadani.site`**.

Stack production yang dipakai di panduan ini:
- **Next.js 14** (PM2)
- **SQLite** (file database persisten)
- **Nginx** reverse proxy + SSL (Let's Encrypt)
- **PM2** process manager (sejajar app lain: meshforge, vouch, mutagen)

> **Catatan VPS kamu:** App lain sudah jalan di PM2. Finance Tracker pakai **port internal 3010** supaya tidak bentrok dengan service lain yang mungkin sudah pakai port 3000.

---

## Daftar Isi

1. [Ringkasan Arsitektur](#1-ringkasan-arsitektur)
2. [Prasyarat](#2-prasyarat)
3. [DNS — Arahkan Domain ke VPS](#3-dns--arahkan-domain-ke-vps)
4. [Deploy Pertama Kali (Step-by-Step)](#4-deploy-pertama-kali-step-by-step)
5. [Konfigurasi Nginx + SSL](#5-konfigurasi-nginx--ssl)
6. [PM2 — Jalankan & Autostart](#6-pm2--jalankan--autostart)
7. [Cron — Notifikasi Push & Backup DB](#7-cron--notifikasi-push--backup-db)
8. [Update / Redeploy](#8-update--redeploy)
9. [Opsi Docker (Alternatif)](#9-opsi-docker-alternatif)
10. [Environment Variables](#10-environment-variables)
11. [Troubleshooting](#11-troubleshooting)
12. [Checklist Production](#12-checklist-production)

---

## 1. Ringkasan Arsitektur

```
Browser / iPhone PWA
        │
        ▼
https://finance.pramadani.site  (Nginx :443)
        │
        ▼
127.0.0.1:3010  (PM2 → finance-tracker / Next.js)
        │
        ▼
~/apps/finance-tracker/data/prod.db  (SQLite)
```

| Komponen | Lokasi / Nilai |
|----------|----------------|
| Domain | `finance.pramadani.site` |
| App path | `/root/apps/finance-tracker` |
| Port internal | `3010` |
| PM2 process name | `finance-tracker` |
| Database | `data/prod.db` |
| Nginx config | `/etc/nginx/sites-available/finance.pramadani.site` |

---

## 2. Prasyarat

### Di laptop (local)

- Git
- Repo sudah di-push ke GitHub (`pramadanif/myfinancialtracker` atau remote kamu)

### Di VPS (sudah ada sebagian besar)

SSH ke server:

```bash
ssh root@ubuntu-s-2vcpu-4gb-sgp1-01
# atau
ssh root@<IP_VPS_KAMU>
```

Cek prasyarat:

```bash
node -v    # butuh v20+
npm -v
pm2 -v
nginx -v
certbot --version
```

Kalau Node belum v20+:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

Kalau Nginx/Certbot belum ada:

```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

Cek port yang sudah dipakai (hindari bentrok):

```bash
ss -tlnp | grep -E ':3000|:3010|:80|:443'
```

---

## 3. DNS — Arahkan Domain ke VPS

Di panel DNS domain `pramadani.site` (Cloudflare / Namecheap / dll):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `finance` | `<IP_PUBLIK_VPS>` | Auto / 300 |

Contoh: `finance.pramadani.site` → `157.xxx.xxx.xxx`

Verifikasi (tunggu propagasi 1–15 menit):

```bash
dig +short finance.pramadani.site
# harus return IP VPS
```

> Kalau pakai **Cloudflare**: untuk pertama kali SSL Certbot, set proxy ke **DNS only** (abu-abu) dulu. Setelah SSL aktif, bisa nyalakan proxy lagi.

---

## 4. Deploy Pertama Kali (Step-by-Step)

### 4.1 Clone repo ke `~/apps`

```bash
cd ~/apps
git clone https://github.com/pramadanif/myfinancialtracker.git finance-tracker
cd finance-tracker
```

### 4.2 Install dependencies

```bash
npm ci
```

### 4.3 Buat file `.env` production

```bash
cp .env.example .env
nano .env
```

Isi `.env` production (ganti semua nilai contoh):

```env
DATABASE_URL="file:./data/prod.db"
SESSION_SECRET="<generate: openssl rand -base64 32>"
APP_PASSWORD="<password-login-kamu-yang-kuat>"
PORT=3010

# Web Push — generate di VPS:
# npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="<public-key>"
VAPID_PRIVATE_KEY="<private-key>"
VAPID_SUBJECT="mailto:bavaguvus01@gmail.com"

CRON_SECRET="<generate: openssl rand -base64 32>"
APP_URL="https://finance.pramadani.site"
```

Generate secret di VPS:

```bash
openssl rand -base64 32          # SESSION_SECRET
openssl rand -base64 32          # CRON_SECRET
npx web-push generate-vapid-keys  # VAPID keys
```

### 4.4 Siapkan folder database

```bash
mkdir -p data
chmod 700 data
```

### 4.5 Migrate & seed database

```bash
npx prisma migrate deploy
npm run db:seed
```

> Seed hanya perlu sekali di deploy pertama. Jangan jalankan ulang kalau tidak ingin data sample ditimpa.

### 4.6 Build production

```bash
npm run build
```

Pastikan sukses tanpa error.

### 4.7 Test manual (sebelum Nginx)

```bash
PORT=3010 npm start
```

Dari VPS:

```bash
curl -I http://127.0.0.1:3010/login
# harus HTTP 200
```

Stop dengan `Ctrl+C`, lanjut ke PM2.

---

## 5. Konfigurasi Nginx + SSL

### 5.1 Buat config Nginx

```bash
nano /etc/nginx/sites-available/finance.pramadani.site
```

Isi:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name finance.pramadani.site;

    # Certbot akan isi redirect HTTPS setelah SSL aktif
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Service worker — jangan di-cache agresif oleh proxy
    location = /sw.js {
        proxy_pass http://127.0.0.1:3010;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        proxy_set_header Host $host;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3010;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_set_header Host $host;
    }
}
```

Aktifkan site:

```bash
ln -sf /etc/nginx/sites-available/finance.pramadani.site /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5.2 Pasang SSL (Let's Encrypt)

```bash
certbot --nginx -d finance.pramadani.site
```

Pilih redirect HTTP → HTTPS (recommended).

Test auto-renewal:

```bash
certbot renew --dry-run
```

### 5.3 Verifikasi HTTPS

```bash
curl -I https://finance.pramadani.site/login
```

Browser: buka `https://finance.pramadani.site` → halaman login muncul.

---

## 6. PM2 — Jalankan & Autostart

File `ecosystem.config.js` sudah disediakan di repo (port 3010, cwd `/root/apps/finance-tracker`).

### 6.1 Start app

```bash
cd ~/apps/finance-tracker
pm2 start ecosystem.config.js
pm2 save
```

### 6.2 Cek status

```bash
pm2 list
pm2 logs finance-tracker --lines 50
```

Output `pm2 list` harus menampilkan `finance-tracker` status **online**.

### 6.3 Autostart saat reboot VPS

Kalau belum pernah setup (kemungkinan sudah, karena app lain jalan):

```bash
pm2 startup
# jalankan perintah yang dikeluarkan PM2 (copy-paste)
pm2 save
```

### 6.4 Perintah PM2 berguna

```bash
pm2 restart finance-tracker   # restart setelah update
pm2 stop finance-tracker
pm2 delete finance-tracker
pm2 monit                     # monitor CPU/RAM live
```

---

## 7. Cron — Notifikasi Push & Backup DB

### 7.1 Cron notifikasi (setiap jam)

```bash
crontab -e
```

Tambahkan:

```cron
0 * * * * cd /root/apps/finance-tracker && /usr/bin/node --env-file=.env scripts/cron-once.mjs >> /var/log/finance-cron.log 2>&1
```

Test manual:

```bash
cd ~/apps/finance-tracker
npm run cron:notifications
```

### 7.2 Backup database harian (jam 02:00)

```bash
chmod +x ~/apps/finance-tracker/scripts/backup.sh
```

Tambahkan di crontab:

```cron
0 2 * * * /root/apps/finance-tracker/scripts/backup.sh >> /var/log/finance-backup.log 2>&1
```

Backup tersimpan di `/var/backups/finance-tracker/` (retensi 30 hari).

Restore manual:

```bash
cp /var/backups/finance-tracker/finance_YYYYMMDD_HHMMSS.db \
   /root/apps/finance-tracker/data/prod.db
pm2 restart finance-tracker
```

---

## 8. Update / Redeploy

Setiap ada perubahan code di GitHub:

```bash
cd ~/apps/finance-tracker

# 1. Pull perubahan terbaru
git pull origin main

# 2. Install dep baru (kalau package.json berubah)
npm ci

# 3. Migrate DB (kalau ada migration baru)
npx prisma migrate deploy

# 4. Rebuild
npm run build

# 5. Restart PM2
pm2 restart finance-tracker

# 6. Cek log
pm2 logs finance-tracker --lines 30
```

### Deploy cepat (one-liner)

```bash
cd ~/apps/finance-tracker && git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart finance-tracker
```

---

## 9. Opsi Docker (Alternatif)

Kalau lebih suka Docker daripada PM2:

```bash
cd ~/apps/finance-tracker
cp .env.example .env
# edit .env — set APP_URL=https://finance.pramadani.site

docker compose up -d --build
```

Ubah port mapping di `docker-compose.yml` jika 3000 bentrok:

```yaml
ports:
  - "3010:3000"
```

Lalu arahkan Nginx `proxy_pass` ke `127.0.0.1:3010`.

> **Rekomendasi untuk VPS kamu:** pakai **PM2** (konsisten dengan meshforge, vouch, dll).

---

## 10. Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | ✅ | `file:./data/prod.db` |
| `SESSION_SECRET` | ✅ | Min 32 karakter random (`openssl rand -base64 32`) |
| `APP_PASSWORD` | ✅ | Password login app |
| `PORT` | ❌ | Default `3010` di production VPS |
| `VAPID_PUBLIC_KEY` | ✅* | Untuk push notification |
| `VAPID_PRIVATE_KEY` | ✅* | Untuk push notification |
| `VAPID_SUBJECT` | ✅* | `mailto:email-kamu@domain.com` |
| `CRON_SECRET` | ✅* | Auth header cron endpoint |
| `APP_URL` | ✅* | `https://finance.pramadani.site` |

\* Wajib kalau fitur push notification dipakai.

**Jangan commit file `.env` ke Git.**

---

## 11. Troubleshooting

### Situs tidak bisa diakses

```bash
pm2 list                              # finance-tracker online?
curl -I http://127.0.0.1:3010/login   # app merespons?
nginx -t && systemctl status nginx    # nginx OK?
dig +short finance.pramadani.site       # DNS benar?
```

### 502 Bad Gateway

App belum jalan atau port salah:

```bash
pm2 restart finance-tracker
ss -tlnp | grep 3010
```

Pastikan `ecosystem.config.js` dan Nginx pakai port yang sama.

### Login gagal terus

Cek `APP_PASSWORD` di `.env` sudah benar, lalu restart:

```bash
pm2 restart finance-tracker
```

### Database error / migration gagal

```bash
cd ~/apps/finance-tracker
npx prisma migrate deploy
ls -la data/prod.db    # file ada & readable?
```

### Push notification tidak jalan

1. `APP_URL` harus `https://finance.pramadani.site`
2. VAPID keys harus terisi di `.env`
3. Cron harus jalan: `npm run cron:notifications`
4. User harus buka dari **Home Screen** (PWA), bukan tab browser biasa (iOS)

### PWA / Service Worker error di dev

Service worker **tidak aktif** saat `npm run dev`. Hanya aktif di production (`NODE_ENV=production`).

### Hydration error di browser

Hard refresh: `Cmd+Shift+R`. Kalau dari PWA iPhone: hapus icon → Add to Home Screen lagi.

### RAM penuh saat build

VPS 4GB biasanya cukup. Kalau OOM saat `npm run build`:

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

---

## 12. Checklist Production

Gunakan checklist ini setelah deploy pertama:

- [ ] DNS `finance.pramadani.site` → IP VPS
- [ ] `https://finance.pramadani.site` buka tanpa error SSL
- [ ] Login dengan `APP_PASSWORD` berhasil
- [ ] Tambah transaksi → data langsung update tanpa refresh manual
- [ ] `pm2 list` → `finance-tracker` **online**
- [ ] `pm2 save` + `pm2 startup` sudah dijalankan
- [ ] Cron notifikasi terpasang (`crontab -l`)
- [ ] Cron backup terpasang
- [ ] `.env` tidak ada di Git (`git status` bersih)
- [ ] Password production kuat (bukan `admin123`)
- [ ] PWA: Add to Home Screen di iPhone → fullscreen tanpa address bar
- [ ] Icon custom muncul di home screen

---

## Ringkasan Perintah Cepat

```bash
# SSH
ssh root@ubuntu-s-2vcpu-4gb-sgp1-01

# Deploy pertama
cd ~/apps && git clone https://github.com/pramadanif/myfinancialtracker.git finance-tracker
cd finance-tracker && cp .env.example .env && nano .env
mkdir -p data && npm ci && npx prisma migrate deploy && npm run db:seed && npm run build
pm2 start ecosystem.config.js && pm2 save

# SSL
certbot --nginx -d finance.pramadani.site

# Update
cd ~/apps/finance-tracker && git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart finance-tracker
```

---

**Domain production:** [https://finance.pramadani.site](https://finance.pramadani.site)

**Support:** Cek log PM2 (`pm2 logs finance-tracker`) dan Nginx (`tail -f /var/log/nginx/error.log`) jika ada masalah.
