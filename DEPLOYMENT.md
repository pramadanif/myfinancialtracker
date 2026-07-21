# Finance Tracker - Deployment Guide

## Quick Start dengan Docker

```bash
# 1. Clone & setup environment
cp .env.example .env
# Edit .env: set SESSION_SECRET dan APP_PASSWORD

# 2. Build & run
docker-compose up -d --build

# 3. Akses di http://your-server-ip:3000
```

Data SQLite tersimpan di Docker volume `finance-data` dan tetap ada setelah container restart.

---

## Deployment Manual (tanpa Docker)

### Prerequisites
- Node.js 20+
- PM2 (`npm install -g pm2`)
- Nginx
- Certbot (untuk SSL)

### 1. Build Production

```bash
# Clone project ke server
cd /var/www/finance-tracker

# Install dependencies
npm ci

# Setup environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL="file:./data/prod.db"
#   SESSION_SECRET="your-random-32-char-secret"
#   APP_PASSWORD="your-secure-password"

# Buat folder data
mkdir -p data

# Migrate & seed database
npx prisma migrate deploy
npm run db:seed

# Build
npm run build
```

### 2. PM2 Process Manager

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: "finance-tracker",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    cwd: "/var/www/finance-tracker",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      DATABASE_URL: "file:./data/prod.db",
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: "500M",
  }],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy

Buat file `/etc/nginx/sites-available/finance-tracker`:

```nginx
server {
    listen 80;
    server_name finance.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/finance-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d finance.yourdomain.com
```

Certbot otomatis mengkonfigurasi HTTPS dan auto-renewal.

---

## Backup SQLite Otomatis

### Script Backup

Buat file `/var/www/finance-tracker/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/finance-tracker"
DB_PATH="/var/www/finance-tracker/data/prod.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/finance_${TIMESTAMP}.db"

# Hapus backup lebih dari 30 hari
find "$BACKUP_DIR" -name "finance_*.db" -mtime +30 -delete

echo "Backup selesai: finance_${TIMESTAMP}.db"
```

```bash
chmod +x /var/www/finance-tracker/scripts/backup.sh
```

### Cron Job Harian

```bash
crontab -e
```

Tambahkan baris berikut (backup setiap hari jam 2 pagi):

```
0 2 * * * /var/www/finance-tracker/scripts/backup.sh >> /var/log/finance-backup.log 2>&1
```

### Backup Docker Volume

```bash
# Manual backup
docker cp finance-tracker-finance-tracker-1:/app/data/prod.db ./backup_$(date +%Y%m%d).db

# Atau via volume
docker run --rm -v finance-tracker_finance-data:/data -v $(pwd):/backup alpine cp /data/prod.db /backup/
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./data/prod.db` |
| `SESSION_SECRET` | Yes | Random 32+ char string for cookie encryption |
| `APP_PASSWORD` | Yes | Single-user login password |
| `PORT` | No | Default 3000 |

Generate SESSION_SECRET:
```bash
openssl rand -base64 32
```
