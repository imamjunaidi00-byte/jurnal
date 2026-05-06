#!/bin/bash

# ============================================================
#   install.sh - Auto Install jurnal-guru di VPS (Ubuntu)
#   Jalankan sebagai root: bash install.sh
#   Atau: sudo bash install.sh
# ============================================================

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Konfigurasi - SESUAIKAN INI
APP_DIR="/var/www/jurnal"
APP_NAME="jurnal-guru"
REPO_URL="https://github.com/imamjunaidi00-byte/jurnal.git"
APP_PORT=3000
DOMAIN=""  # Isi domain kamu, contoh: jurnal.sekolah.sch.id (kosongkan jika pakai IP)

# ============================================================

print_step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}  → $1${NC}"; }
print_err()  { echo -e "${RED}  ✗ $1${NC}"; }

# Cek root
if [ "$EUID" -ne 0 ]; then
  print_err "Jalankan sebagai root: sudo bash install.sh"
  exit 1
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INSTALLER jurnal-guru - VPS Setup        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Repo   : ${REPO_URL}"
echo -e "  Folder : ${APP_DIR}"
echo -e "  Port   : ${APP_PORT}"
echo ""
read -p "  Lanjutkan instalasi? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Instalasi dibatalkan."
  exit 0
fi

# ============================================================
# STEP 1: Update sistem
# ============================================================
print_step "STEP 1/7: Update sistem"
apt-get update -y && apt-get upgrade -y
print_ok "Sistem diupdate"

# ============================================================
# STEP 2: Install Node.js 18 LTS
# ============================================================
print_step "STEP 2/7: Install Node.js 18 LTS"

if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  print_info "Node.js sudah terinstall: $NODE_VER"
else
  print_info "Menginstall Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  print_ok "Node.js $(node -v) berhasil diinstall"
fi

# ============================================================
# STEP 3: Install MongoDB
# ============================================================
print_step "STEP 3/7: Install MongoDB"

if command -v mongod &>/dev/null; then
  print_info "MongoDB sudah terinstall: $(mongod --version | head -1)"
else
  print_info "Menginstall MongoDB 7.0..."
  
  # Import MongoDB GPG key
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

  # Tambah repo MongoDB
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
    https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list

  apt-get update -y
  apt-get install -y mongodb-org

  # Start dan enable MongoDB
  systemctl start mongod
  systemctl enable mongod

  print_ok "MongoDB berhasil diinstall dan dijalankan"
fi

# Pastikan MongoDB berjalan
systemctl start mongod
print_ok "MongoDB status: $(systemctl is-active mongod)"

# ============================================================
# STEP 4: Install PM2
# ============================================================
print_step "STEP 4/7: Install PM2"

if command -v pm2 &>/dev/null; then
  print_info "PM2 sudah terinstall: $(pm2 -v)"
else
  npm install -g pm2
  print_ok "PM2 $(pm2 -v) berhasil diinstall"
fi

# ============================================================
# STEP 5: Clone / Update aplikasi
# ============================================================
print_step "STEP 5/7: Clone aplikasi dari GitHub"

if [ -d "$APP_DIR/.git" ]; then
  print_info "Folder sudah ada, melakukan git pull..."
  cd "$APP_DIR"
  git pull origin main
else
  print_info "Cloning dari GitHub..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
print_info "Menginstall npm dependencies..."
npm install --production
print_ok "Dependencies terinstall"

# ============================================================
# STEP 6: Setup file .env
# ============================================================
print_step "STEP 6/7: Setup konfigurasi .env"

if [ -f "$APP_DIR/.env" ]; then
  print_info "File .env sudah ada, melewati..."
else
  print_info "Membuat file .env dari template..."
  
  # Generate JWT secret otomatis
  JWT_SECRET=$(openssl rand -hex 32)
  
  cat > "$APP_DIR/.env" << EOF
NODE_ENV=production
PORT=${APP_PORT}
MONGODB_URI=mongodb://127.0.0.1:27017/jurnal_guru
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=30d
EOF

  print_ok "File .env berhasil dibuat"
  print_info "JWT_SECRET sudah di-generate otomatis"
fi

# ============================================================
# STEP 7: Start aplikasi dengan PM2
# ============================================================
print_step "STEP 7/7: Menjalankan aplikasi"

cd "$APP_DIR"

if pm2 list | grep -q "$APP_NAME"; then
  print_info "Merestart aplikasi..."
  pm2 restart "$APP_NAME"
else
  print_info "Menjalankan aplikasi untuk pertama kali..."
  pm2 start server.js --name "$APP_NAME"
fi

pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

print_ok "Aplikasi berjalan dengan PM2"

# ============================================================
# STEP BONUS: Setup Nginx (opsional)
# ============================================================
if [ -n "$DOMAIN" ]; then
  print_step "BONUS: Setup Nginx untuk domain $DOMAIN"
  
  apt-get install -y nginx
  
  cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
  nginx -t && systemctl reload nginx
  print_ok "Nginx dikonfigurasi untuk domain $DOMAIN"
fi

# ============================================================
# SELESAI
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         INSTALASI SELESAI!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Dapatkan IP VPS
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "  ${GREEN}✓${NC} Aplikasi berjalan di:"
if [ -n "$DOMAIN" ]; then
  echo -e "    ${CYAN}http://${DOMAIN}${NC}"
fi
echo -e "    ${CYAN}http://${VPS_IP}:${APP_PORT}${NC}"
echo ""
echo -e "  ${YELLOW}Perintah berguna:${NC}"
echo -e "    pm2 status              → cek status app"
echo -e "    pm2 logs $APP_NAME      → lihat log"
echo -e "    pm2 restart $APP_NAME   → restart app"
echo -e "    bash $APP_DIR/update.sh → update dari GitHub"
echo ""
echo -e "  ${YELLOW}MongoDB:${NC}"
echo -e "    mongosh                 → masuk MongoDB shell"
echo -e "    bash $APP_DIR/db.sh     → kelola database"
echo ""
