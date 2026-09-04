#!/bin/bash
# =============================================================================
# E-Journal SMK — Script Update Aplikasi
# Jalankan dari direktori app atau sebagai user app:
#   bash update.sh
#   atau: sudo -u ejournal bash update.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

APP_DIR="${APP_DIR:-$(pwd)}"
APP_NAME="${APP_NAME:-ejournal-smk}"

# Pastikan di direktori app
[[ ! -f "$APP_DIR/server.js" ]] && error "server.js tidak ditemukan. Pastikan APP_DIR benar: $APP_DIR"

cd "$APP_DIR"

info "=== E-Journal SMK Update ==="
info "Direktori: $APP_DIR"
echo ""

# ─── 1. Backup .env ───────────────────────────────────────────────────────────
info "1/5 Backup .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
ok ".env di-backup."

# ─── 2. Pull dari GitHub ──────────────────────────────────────────────────────
info "2/5 Pull kode terbaru dari GitHub..."
git fetch origin
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
ok "Kode terbaru berhasil diunduh."

# Restore .env (jaga-jaga tertimpa)
LATEST_BACKUP=$(ls -t .env.backup.* 2>/dev/null | head -1)
if [[ -n "$LATEST_BACKUP" ]] && [[ ! -f ".env" ]]; then
  cp "$LATEST_BACKUP" .env
  warn ".env dikembalikan dari backup."
fi

# ─── 3. Install / update dependencies ────────────────────────────────────────
info "3/5 Update npm dependencies..."
npm install --production --no-audit
ok "Dependencies diperbarui."

# ─── 4. Jalankan migrasi database ────────────────────────────────────────────
info "4/5 Jalankan migrasi database (alter safe)..."
node src/database/migrate.js
ok "Migrasi database selesai."

# ─── 5. Restart aplikasi via PM2 ─────────────────────────────────────────────
info "5/5 Restart aplikasi PM2..."
if pm2 describe "$APP_NAME" &>/dev/null; then
  pm2 reload "$APP_NAME" --update-env
  ok "Aplikasi '$APP_NAME' berhasil direload."
else
  warn "Proses PM2 '$APP_NAME' tidak ditemukan. Memulai ulang..."
  pm2 start ecosystem.config.js
  pm2 save
  ok "Aplikasi dimulai."
fi

echo ""
ok "=== Update selesai! ==="
pm2 status "$APP_NAME"
