#!/usr/bin/env bash
# Cron wrapper — pasang di crontab VPS:
# 0 * * * * cd /var/www/finance-tracker && /usr/bin/node --env-file=.env scripts/cron-once.mjs >> /var/log/finance-cron.log 2>&1

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"
exec node --env-file=.env scripts/cron-once.mjs
