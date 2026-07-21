# Finance Tracker

Aplikasi personal finance tracker mobile-first dengan Next.js 14, TypeScript, Prisma + SQLite, dan design system BCA blue.

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
cp .env.example .env
# Edit .env: set APP_PASSWORD dan SESSION_SECRET

# Migrate & seed
npx prisma migrate deploy
npm run db:seed

# Run dev server
npm run dev
```

Buka http://localhost:3000 — login dengan password dari `APP_PASSWORD` (default: `admin123`).

## Fitur

- **Quick Add Transaction** — FAB (+) di semua halaman, numpad, shortcut, transfer antar akun
- **Dashboard** — total saldo, progress budget mingguan, chart 5 minggu, alert 90%+
- **Kalender** — tampilan bulanan dengan total per hari, filter akun/kategori
- **Transaksi** — list dengan filter, pagination, kelola shortcut
- **Budget & Kategori** — edit target, tambah kategori custom
- **Laporan** — breakdown kategori, income vs outcome, export CSV

## Tech Stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS (palette BCA blue)
- Prisma ORM + SQLite
- Recharts + date-fns
- iron-session (auth cookie-based)

## Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap:
- Docker (`docker-compose up`)
- Manual (PM2 + Nginx + SSL)
- Backup SQLite otomatis (cron)

## Struktur Folder

```
app/           # Pages & API routes (App Router)
components/    # UI components (ui/, layout/, dashboard/, transactions/)
lib/           # Prisma client, auth, transactions logic, utils
prisma/        # Schema, migrations, seed
types/         # TypeScript types & enums
```

## Default Seed Data

- **Akun:** BCA, Seabank, Cash
- **14 kategori** dengan budget mingguan/bulanan
- **5 shortcut** awal (Warkop, Bensin, Warung, Top Up, Minimarket)
# myfinancialtracker
