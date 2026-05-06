#!/bin/bash

# ============================================
#   push.sh - Push ke GitHub dari Lokal
#   Aplikasi: jurnal-guru
#   Repo: https://github.com/imamjunaidi00-byte/jurnal.git
# ============================================

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==============================${NC}"
echo -e "${YELLOW}   PUSH jurnal-guru ke GitHub ${NC}"
echo -e "${YELLOW}==============================${NC}"

# Cek apakah sudah di dalam git repo
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}[INFO] Git belum diinisialisasi. Menginisialisasi...${NC}"
  git init
  git remote add origin https://github.com/imamjunaidi00-byte/jurnal.git
  git branch -M main
fi

# Cek apakah ada remote origin
if ! git remote get-url origin &>/dev/null; then
  echo -e "${YELLOW}[INFO] Menambahkan remote origin...${NC}"
  git remote add origin https://github.com/imamjunaidi00-byte/jurnal.git
fi

# Tampilkan status perubahan
echo ""
echo -e "${YELLOW}[INFO] File yang berubah:${NC}"
git status --short

# Cek apakah ada perubahan
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}[OK] Tidak ada perubahan. Sudah up to date.${NC}"
  exit 0
fi

# Minta pesan commit
echo ""
read -p "Masukkan pesan commit (Enter = 'update'): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"update"}

# Proses git
echo ""
echo -e "${YELLOW}[1/3] Menambahkan semua file...${NC}"
git add .

echo -e "${YELLOW}[2/3] Commit: '${COMMIT_MSG}'...${NC}"
git commit -m "$COMMIT_MSG"

echo -e "${YELLOW}[3/3] Push ke GitHub...${NC}"
git push -u origin main

# Cek hasil push
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}==============================${NC}"
  echo -e "${GREEN}   BERHASIL push ke GitHub!   ${NC}"
  echo -e "${GREEN}==============================${NC}"
else
  echo ""
  echo -e "${RED}[ERROR] Push gagal. Cek koneksi atau token GitHub kamu.${NC}"
  exit 1
fi
