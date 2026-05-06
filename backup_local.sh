#!/bin/bash

# ============================================================
#   backup_local.sh - Backup MongoDB lokal & Upload ke VPS
#   Jalankan di LAPTOP: bash backup_local.sh
#
#   Yang dilakukan:
#   1. Backup database MongoDB lokal
#   2. Upload file backup ke VPS via SCP
#   3. Restore otomatis di VPS
# ============================================================

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================
# KONFIGURASI - SESUAIKAN INI
# ============================================================
DB_NAME="jurnal_guru"                    # Nama database lokal
VPS_IP="10.10.103.21"                    # Ganti dengan IP VPS kamu
VPS_USER="root"                          # User SSH VPS
VPS_PORT="22"                            # Port SSH VPS (default 22)
VPS_APP_DIR="/root/jurnal"               # Folder app di VPS
VPS_BACKUP_DIR="/root/backups/jurnal"    # Folder backup di VPS
BACKUP_DIR="./backups"                   # Folder backup di lokal
# ============================================================

print_ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}  → $1${NC}"; }
print_err()  { echo -e "${RED}  ✗ $1${NC}"; }
print_step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BACKUP LOKAL → UPLOAD → RESTORE VPS       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Database : ${CYAN}${DB_NAME}${NC}"
echo -e "  VPS      : ${CYAN}${VPS_USER}@${VPS_IP}:${VPS_PORT}${NC}"
echo ""

# ============================================================
# STEP 1: Cek tools yang dibutuhkan
# ============================================================
print_step "STEP 1/4: Cek tools"

for tool in mongodump scp ssh; do
  if command -v "$tool" &>/dev/null; then
    print_ok "$tool tersedia"
  else
    print_err "$tool tidak ditemukan!"
    if [ "$tool" == "mongodump" ]; then
      echo ""
      echo "  Install MongoDB Tools dulu:"
      echo "  Windows: https://www.mongodb.com/try/download/database-tools"
      echo "  Atau pastikan MongoDB sudah terinstall di laptop"
    fi
    exit 1
  fi
done

# ============================================================
# STEP 2: Backup database lokal
# ============================================================
print_step "STEP 2/4: Backup database lokal"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${DB_NAME}_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

print_info "Membackup database '${DB_NAME}'..."
mongodump --db="$DB_NAME" --out="$BACKUP_PATH" 2>/dev/null

if [ $? -ne 0 ]; then
  print_err "Backup gagal! Pastikan MongoDB lokal berjalan."
  exit 1
fi

# Compress
print_info "Mengkompress backup..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

BACKUP_FILE="${BACKUP_PATH}.tar.gz"
SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
print_ok "Backup selesai: ${BACKUP_FILE} (${SIZE})"

# ============================================================
# STEP 3: Upload ke VPS
# ============================================================
print_step "STEP 3/4: Upload backup ke VPS"

print_info "Membuat folder backup di VPS..."
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_BACKUP_DIR}" 2>/dev/null

if [ $? -ne 0 ]; then
  print_err "Tidak bisa konek ke VPS! Cek IP, user, dan SSH key."
  echo ""
  echo "  Pastikan kamu sudah setup SSH key atau coba:"
  echo "  ssh ${VPS_USER}@${VPS_IP} -p ${VPS_PORT}"
  exit 1
fi

print_info "Mengupload file backup..."
scp -P "$VPS_PORT" "$BACKUP_FILE" "${VPS_USER}@${VPS_IP}:${VPS_BACKUP_DIR}/"

if [ $? -ne 0 ]; then
  print_err "Upload gagal!"
  exit 1
fi

print_ok "Upload berhasil: ${VPS_BACKUP_DIR}/$(basename $BACKUP_FILE)"

# ============================================================
# STEP 4: Restore di VPS
# ============================================================
print_step "STEP 4/4: Restore database di VPS"

REMOTE_BACKUP="${VPS_BACKUP_DIR}/$(basename $BACKUP_FILE)"

print_info "Menjalankan restore di VPS..."
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_IP}" bash << ENDSSH
  set -e
  
  # Extract backup
  TEMP_DIR=\$(mktemp -d)
  tar -xzf "${REMOTE_BACKUP}" -C "\$TEMP_DIR"
  
  # Cari folder dump
  DUMP_DIR=\$(find "\$TEMP_DIR" -name "${DB_NAME}" -type d | head -1)
  
  if [ -z "\$DUMP_DIR" ]; then
    DUMP_DIR=\$(find "\$TEMP_DIR" -mindepth 2 -maxdepth 2 -type d | head -1)
  fi
  
  echo "  Restoring dari: \$DUMP_DIR"
  
  # Restore (--drop = hapus data lama dulu)
  mongorestore --db="${DB_NAME}" --drop "\$DUMP_DIR" 2>/dev/null
  
  # Bersihkan temp
  rm -rf "\$TEMP_DIR"
  
  echo "  Restore selesai!"
ENDSSH

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         SEMUA PROSES BERHASIL!               ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  print_ok "Database lokal berhasil dipindahkan ke VPS"
  print_info "File backup lokal tersimpan di: ${BACKUP_FILE}"
  print_info "File backup VPS tersimpan di: ${VPS_BACKUP_DIR}/$(basename $BACKUP_FILE)"
  echo ""
else
  print_err "Restore di VPS gagal!"
  echo ""
  print_info "File backup sudah terupload di VPS: ${REMOTE_BACKUP}"
  print_info "Restore manual di VPS dengan perintah:"
  echo ""
  echo "  bash ${VPS_APP_DIR}/db.sh  → pilih menu [4] Restore"
  echo ""
  exit 1
fi
