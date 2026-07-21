#!/bin/bash
BACKUP_DIR="/var/backups/finance-tracker"
DB_PATH="./data/prod.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_DIR/finance_${TIMESTAMP}.db"
  find "$BACKUP_DIR" -name "finance_*.db" -mtime +30 -delete
  echo "Backup selesai: finance_${TIMESTAMP}.db"
else
  echo "Database tidak ditemukan: $DB_PATH"
  exit 1
fi
