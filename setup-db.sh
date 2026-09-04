#!/bin/bash
# =============================================================================
# E-Journal SMK — Setup Database MariaDB
# Jalankan setelah install.sh jika perlu setup ulang database saja
# Gunakan: sudo bash setup-db.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Jalankan sebagai root: sudo bash setup-db.sh"

APP_DIR="${APP_DIR:-/var/www/ejournal}"

# Baca dari .env jika ada
if [[ -f "$APP_DIR/.env" ]]; then
  export $(grep -v '^#' "$APP_DIR/.env" | grep -E '^DB_' | xargs)
  info "Konfigurasi dibaca dari $APP_DIR/.env"
fi

DB_NAME="${DB_NAME:-ejournal_smk}"
DB_USER="${DB_USER:-ejournal_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24)}"

info "Setup database: $DB_NAME"

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

ok "Database dan user siap."
info "Menjalankan migrasi..."
cd "$APP_DIR" && node src/database/migrate.js
ok "Migrasi selesai."

echo ""
info "Buat akun admin? [y/N]: "
read -r CREATE_ADMIN
if [[ "${CREATE_ADMIN,,}" == "y" ]]; then
  cd "$APP_DIR" && node src/database/seed.js
fi

ok "Setup database selesai!"
