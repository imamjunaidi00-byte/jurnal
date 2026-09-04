#!/bin/bash
# =============================================================================
# E-Journal SMK v2.0 — Script Instalasi Otomatis untuk Ubuntu 24 LTS
# Jalankan sebagai root atau user dengan sudo:
#   sudo bash install.sh
# =============================================================================

set -euo pipefail

# ─── Warna output ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── Cek root ──────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Script harus dijalankan sebagai root. Gunakan: sudo bash install.sh"

# ─── Variabel konfigurasi (ubah sesuai kebutuhan) ────────────────────────────
APP_USER="${APP_USER:-ejournal}"
APP_DIR="${APP_DIR:-/var/www/ejournal}"
APP_PORT="${APP_PORT:-3000}"
DB_NAME="${DB_NAME:-ejournal_smk}"
DB_USER="${DB_USER:-ejournal_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24)}"
JWT_SECRET="$(openssl rand -hex 64)"
NODE_VERSION="20"   # Node.js LTS

echo ""
echo "================================================================="
echo "   E-Journal SMK v2.0 — Instalasi Ubuntu 24 LTS"
echo "================================================================="
echo ""
info "Konfigurasi:"
echo "  App Dir   : $APP_DIR"
echo "  App Port  : $APP_PORT"
echo "  App User  : $APP_USER"
echo "  DB Name   : $DB_NAME"
echo "  DB User   : $DB_USER"
echo ""
read -rp "Lanjutkan instalasi? [y/N]: " CONFIRM
[[ "${CONFIRM,,}" != "y" ]] && { info "Instalasi dibatalkan."; exit 0; }

# ─── 1. Update sistem ─────────────────────────────────────────────────────────
info "1/9 Update paket sistem..."
apt-get update -y && apt-get upgrade -y
ok "Sistem diperbarui."

# ─── 2. Install dependensi dasar ─────────────────────────────────────────────
info "2/9 Install dependensi dasar..."
apt-get install -y curl wget git unzip build-essential ufw fail2ban
ok "Dependensi dasar terinstal."

# ─── 3. Install Node.js via NodeSource ───────────────────────────────────────
info "3/9 Install Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
else
  INSTALLED_NODE=$(node -v | cut -d'.' -f1 | tr -d 'v')
  if [[ "$INSTALLED_NODE" -lt "$NODE_VERSION" ]]; then
    warn "Node.js $INSTALLED_NODE terdeteksi. Upgrade ke $NODE_VERSION..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt-get install -y nodejs
  fi
fi
ok "Node.js $(node -v) & npm $(npm -v) terinstal."

# ─── 4. Install PM2 ──────────────────────────────────────────────────────────
info "4/9 Install PM2..."
npm install -g pm2
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" || true
ok "PM2 terinstal."

# ─── 5. Install MariaDB ───────────────────────────────────────────────────────
info "5/9 Install MariaDB..."
apt-get install -y mariadb-server mariadb-client
systemctl enable --now mariadb
ok "MariaDB terinstal dan berjalan."

# Setup database & user
info "   Setup database MariaDB..."
mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT
ok "Database '$DB_NAME' dan user '$DB_USER' berhasil dibuat."

# ─── 6. Install Nginx ─────────────────────────────────────────────────────────
info "6/9 Install Nginx..."
apt-get install -y nginx
systemctl enable --now nginx
ok "Nginx terinstal."

# ─── 7. Buat app user & direktori ────────────────────────────────────────────
info "7/9 Setup app user & direktori..."
if ! id -u "$APP_USER" &>/dev/null; then
  useradd -r -m -s /bin/bash "$APP_USER"
  ok "User '$APP_USER' dibuat."
fi

mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
ok "Direktori '$APP_DIR' siap."

# ─── 8. Buat file .env produksi ───────────────────────────────────────────────
info "8/9 Membuat file .env produksi..."
cat > "$APP_DIR/.env" <<ENV
NODE_ENV=production
PORT=${APP_PORT}

DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}

DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQ=30000
DB_POOL_IDLE=10000

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=30d

CORS_ORIGIN=*

ADMIN_USER=admin
ADMIN_PASS=Admin@1234
ADMIN_NAMA=Administrator
ENV
chmod 600 "$APP_DIR/.env"
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
ok "File .env dibuat di $APP_DIR/.env"

# ─── 9. Konfigurasi Nginx ─────────────────────────────────────────────────────
info "9/9 Konfigurasi Nginx..."
DOMAIN="${DOMAIN:-_}"   # Default: terima semua domain
cat > /etc/nginx/sites-available/ejournal <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 10M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_set_header Host \$host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
NGINX

ln -sf /etc/nginx/sites-available/ejournal /etc/nginx/sites-enabled/ejournal
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx dikonfigurasi."

# ─── Konfigurasi UFW firewall ─────────────────────────────────────────────────
info "Setup firewall UFW..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
ok "Firewall UFW aktif."

# ─── Buat PM2 ecosystem config ────────────────────────────────────────────────
cat > "$APP_DIR/ecosystem.config.js" <<PM2
module.exports = {
  apps: [{
    name:        'ejournal-smk',
    script:      'server.js',
    cwd:         '${APP_DIR}',
    instances:   1,
    exec_mode:   'fork',
    watch:       false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
    },
    error_file:  '/var/log/ejournal/error.log',
    out_file:    '/var/log/ejournal/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 3000,
    max_restarts:  10,
  }]
};
PM2
mkdir -p /var/log/ejournal
chown -R "$APP_USER":"$APP_USER" /var/log/ejournal
chown "$APP_USER":"$APP_USER" "$APP_DIR/ecosystem.config.js"

# ─── Selesai ──────────────────────────────────────────────────────────────────
echo ""
echo "================================================================="
ok "Instalasi infrastruktur selesai!"
echo "================================================================="
echo ""
echo "  Langkah selanjutnya:"
echo ""
echo "  1. Deploy kode aplikasi:"
echo "     cd $APP_DIR"
echo "     git clone https://github.com/USERNAME/REPO.git ."
echo ""
echo "  2. Install dependencies Node.js:"
echo "     cd $APP_DIR && npm install --production"
echo ""
echo "  3. Jalankan migrasi database:"
echo "     cd $APP_DIR && node src/database/migrate.js"
echo ""
echo "  4. Buat akun admin pertama:"
echo "     cd $APP_DIR && node src/database/seed.js"
echo ""
echo "  5. Start aplikasi dengan PM2:"
echo "     pm2 start $APP_DIR/ecosystem.config.js"
echo "     pm2 save"
echo ""
echo "  ─── Kredensial Database ───────────────────────────"
echo "  DB Name  : $DB_NAME"
echo "  DB User  : $DB_USER"
echo "  DB Pass  : $DB_PASS"
echo ""
echo "  SIMPAN KREDENSIAL DI ATAS DI TEMPAT AMAN!"
echo "================================================================="
