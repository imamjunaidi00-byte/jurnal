#!/bin/bash

# ============================================
#   update.sh - Update Aplikasi di VPS
#   Aplikasi: jurnal-guru
#   Jalankan di VPS: bash update.sh
# ============================================

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konfigurasi - sesuaikan dengan path di VPS kamu
APP_DIR="/var/www/jurnal"        # Ganti dengan path folder app di VPS
APP_NAME="jurnal-guru"           # Nama PM2 process
BRANCH="main"

echo -e "${YELLOW}==============================${NC}"
echo -e "${YELLOW}   UPDATE jurnal-guru di VPS  ${NC}"
echo -e "${YELLOW}==============================${NC}"

# Masuk ke direktori aplikasi
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}[ERROR] Folder $APP_DIR tidak ditemukan!${NC}"
  echo -e "${YELLOW}[INFO] Clone dulu dengan perintah:${NC}"
  echo "  git clone https://github.com/imamjunaidi00-byte/jurnal.git $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

# Cek apakah ini git repo
if [ ! -d ".git" ]; then
  echo -e "${RED}[ERROR] Bukan git repository. Clone ulang dulu.${NC}"
  exit 1
fi

# Pull dari GitHub
echo ""
echo -e "${YELLOW}[1/4] Pull update dari GitHub...${NC}"
git pull origin "$BRANCH"

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] Git pull gagal!${NC}"
  exit 1
fi

# Install/update dependencies jika package.json berubah
echo ""
echo -e "${YELLOW}[2/4] Install dependencies (jika ada yang baru)...${NC}"
npm install --production

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] npm install gagal!${NC}"
  exit 1
fi

# Cek apakah PM2 sudah running
echo ""
echo -e "${YELLOW}[3/4] Restart aplikasi dengan PM2...${NC}"

if pm2 list | grep -q "$APP_NAME"; then
  # Sudah running, restart saja
  pm2 restart "$APP_NAME"
else
  # Belum running, start baru
  echo -e "${YELLOW}[INFO] Aplikasi belum berjalan, menjalankan untuk pertama kali...${NC}"
  pm2 start server.js --name "$APP_NAME"
  pm2 save
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] PM2 restart gagal!${NC}"
  exit 1
fi

# Tampilkan status
echo ""
echo -e "${YELLOW}[4/4] Status aplikasi:${NC}"
pm2 show "$APP_NAME" | grep -E "status|uptime|restarts|memory"

echo ""
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}   UPDATE BERHASIL!           ${NC}"
echo -e "${GREEN}   App: $APP_NAME             ${NC}"
echo -e "${GREEN}==============================${NC}"
