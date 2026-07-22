#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/var/backups/finance-tracker"
DB_PATH="${APP_DIR}/data/prod.db"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "Database tidak ditemukan: $DB_PATH"
  exit 1
fi

cp "$DB_PATH" "$BACKUP_DIR/finance_${TIMESTAMP}.db"
find "$BACKUP_DIR" -name "finance_*.db" -mtime +30 -delete

echo "[$(date -Iseconds)] Backup selesai: finance_${TIMESTAMP}.db"
