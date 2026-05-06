#!/bin/bash

# ============================================================
#   db.sh - Kelola Database MongoDB jurnal-guru
#   Jalankan di VPS: bash db.sh
# ============================================================

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DB_NAME="jurnal_guru"
BACKUP_DIR="/var/backups/jurnal"

print_ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}  → $1${NC}"; }
print_err()  { echo -e "${RED}  ✗ $1${NC}"; }

show_menu() {
  clear
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║     DATABASE MANAGER - jurnal-guru           ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Database : ${CYAN}${DB_NAME}${NC}"
  echo -e "  Status   : $(systemctl is-active mongod 2>/dev/null || echo 'unknown')"
  echo ""
  echo -e "${YELLOW}  Pilih menu:${NC}"
  echo ""
  echo "  [1] Lihat info database"
  echo "  [2] Masuk MongoDB shell (mongosh)"
  echo "  [3] Backup database"
  echo "  [4] Restore database dari backup"
  echo "  [5] Lihat semua collection & jumlah data"
  echo "  [6] Reset/hapus semua data (HATI-HATI!)"
  echo "  [7] Start / Stop / Restart MongoDB"
  echo "  [8] Lihat log MongoDB"
  echo "  [0] Keluar"
  echo ""
  read -p "  Pilihan: " CHOICE
}

# Cek MongoDB berjalan
check_mongo() {
  if ! systemctl is-active --quiet mongod; then
    print_err "MongoDB tidak berjalan!"
    read -p "  Start MongoDB sekarang? (y/n): " START
    if [[ "$START" == "y" ]]; then
      systemctl start mongod
      sleep 2
      print_ok "MongoDB dijalankan"
    else
      return 1
    fi
  fi
  return 0
}

# Menu 1: Info database
info_db() {
  echo ""
  echo -e "${CYAN}=== INFO DATABASE ===${NC}"
  check_mongo || return
  
  mongosh "$DB_NAME" --quiet --eval "
    print('Database: ' + db.getName());
    print('Collections:');
    db.getCollectionNames().forEach(function(c) {
      print('  - ' + c + ': ' + db[c].countDocuments() + ' dokumen');
    });
    var stats = db.stats();
    print('Ukuran DB: ' + (stats.dataSize / 1024).toFixed(2) + ' KB');
  " 2>/dev/null || mongosh --eval "use $DB_NAME; db.stats()" 2>/dev/null
  
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 2: Masuk shell
open_shell() {
  echo ""
  print_info "Membuka MongoDB shell... (ketik 'exit' untuk keluar)"
  echo ""
  mongosh "$DB_NAME"
}

# Menu 3: Backup
backup_db() {
  echo ""
  echo -e "${CYAN}=== BACKUP DATABASE ===${NC}"
  check_mongo || return
  
  mkdir -p "$BACKUP_DIR"
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_PATH="$BACKUP_DIR/backup_${TIMESTAMP}"
  
  print_info "Membuat backup ke: $BACKUP_PATH"
  mongodump --db="$DB_NAME" --out="$BACKUP_PATH" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    # Compress backup
    tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" "backup_${TIMESTAMP}"
    rm -rf "$BACKUP_PATH"
    print_ok "Backup berhasil: ${BACKUP_PATH}.tar.gz"
    
    # Tampilkan ukuran
    SIZE=$(du -sh "${BACKUP_PATH}.tar.gz" | cut -f1)
    print_info "Ukuran backup: $SIZE"
    
    # Hapus backup lama (simpan 5 terakhir)
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    print_info "Backup lama (>5) dihapus otomatis"
  else
    print_err "Backup gagal!"
  fi
  
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 4: Restore
restore_db() {
  echo ""
  echo -e "${CYAN}=== RESTORE DATABASE ===${NC}"
  check_mongo || return
  
  # Tampilkan daftar backup
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls $BACKUP_DIR/*.tar.gz 2>/dev/null)" ]; then
    print_err "Tidak ada file backup di $BACKUP_DIR"
    read -p "  Tekan Enter untuk kembali..." _
    return
  fi
  
  echo ""
  echo "  File backup tersedia:"
  ls -lt "$BACKUP_DIR"/*.tar.gz | awk '{print NR". "$NF, $5, $6, $7, $8}'
  echo ""
  read -p "  Pilih nomor backup (atau 0 untuk batal): " NUM
  
  if [ "$NUM" == "0" ]; then return; fi
  
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.tar.gz | sed -n "${NUM}p")
  
  if [ -z "$BACKUP_FILE" ]; then
    print_err "Nomor tidak valid"
    read -p "  Tekan Enter untuk kembali..." _
    return
  fi
  
  echo ""
  print_info "File: $BACKUP_FILE"
  read -p "  YAKIN restore? Data sekarang akan diganti! (y/n): " CONFIRM
  
  if [[ "$CONFIRM" != "y" ]]; then
    print_info "Restore dibatalkan"
    read -p "  Tekan Enter untuk kembali..." _
    return
  fi
  
  # Extract dan restore
  TEMP_DIR=$(mktemp -d)
  tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
  
  DUMP_DIR=$(find "$TEMP_DIR" -name "$DB_NAME" -type d | head -1)
  if [ -z "$DUMP_DIR" ]; then
    DUMP_DIR=$(find "$TEMP_DIR" -type d | head -2 | tail -1)
  fi
  
  mongorestore --db="$DB_NAME" --drop "$DUMP_DIR" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    print_ok "Restore berhasil!"
  else
    print_err "Restore gagal!"
  fi
  
  rm -rf "$TEMP_DIR"
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 5: Lihat collections
show_collections() {
  echo ""
  echo -e "${CYAN}=== DATA PER COLLECTION ===${NC}"
  check_mongo || return
  
  mongosh "$DB_NAME" --quiet --eval "
    var cols = db.getCollectionNames();
    if (cols.length === 0) {
      print('  (Database kosong, belum ada data)');
    } else {
      cols.forEach(function(c) {
        var count = db[c].countDocuments();
        var sample = db[c].findOne();
        print('');
        print('  📁 ' + c + ' (' + count + ' data)');
      });
    }
  " 2>/dev/null
  
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 6: Reset data
reset_db() {
  echo ""
  echo -e "${RED}=== RESET DATABASE ===${NC}"
  echo ""
  print_err "PERINGATAN: Semua data akan DIHAPUS PERMANEN!"
  echo ""
  read -p "  Ketik 'HAPUS SEMUA' untuk konfirmasi: " CONFIRM
  
  if [ "$CONFIRM" != "HAPUS SEMUA" ]; then
    print_info "Reset dibatalkan"
    read -p "  Tekan Enter untuk kembali..." _
    return
  fi
  
  # Backup otomatis sebelum reset
  print_info "Membuat backup otomatis sebelum reset..."
  mkdir -p "$BACKUP_DIR"
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  mongodump --db="$DB_NAME" --out="$BACKUP_DIR/before_reset_${TIMESTAMP}" 2>/dev/null
  print_ok "Backup tersimpan di: $BACKUP_DIR/before_reset_${TIMESTAMP}"
  
  # Drop database
  mongosh "$DB_NAME" --quiet --eval "db.dropDatabase()" 2>/dev/null
  print_ok "Database direset. Backup tersedia jika perlu restore."
  
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 7: Kelola service MongoDB
manage_service() {
  echo ""
  echo -e "${CYAN}=== KELOLA MONGODB SERVICE ===${NC}"
  echo ""
  echo "  Status: $(systemctl is-active mongod)"
  echo ""
  echo "  [1] Start MongoDB"
  echo "  [2] Stop MongoDB"
  echo "  [3] Restart MongoDB"
  echo "  [0] Kembali"
  echo ""
  read -p "  Pilihan: " OPT
  
  case $OPT in
    1) systemctl start mongod;   print_ok "MongoDB dijalankan" ;;
    2) systemctl stop mongod;    print_ok "MongoDB dihentikan" ;;
    3) systemctl restart mongod; print_ok "MongoDB direstart" ;;
    0) return ;;
  esac
  
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# Menu 8: Log MongoDB
show_logs() {
  echo ""
  echo -e "${CYAN}=== LOG MONGODB (50 baris terakhir) ===${NC}"
  echo ""
  journalctl -u mongod -n 50 --no-pager 2>/dev/null || \
    tail -50 /var/log/mongodb/mongod.log 2>/dev/null || \
    print_err "Log tidak ditemukan"
  echo ""
  read -p "  Tekan Enter untuk kembali..." _
}

# ============================================================
# MAIN LOOP
# ============================================================
while true; do
  show_menu
  case $CHOICE in
    1) info_db ;;
    2) open_shell ;;
    3) backup_db ;;
    4) restore_db ;;
    5) show_collections ;;
    6) reset_db ;;
    7) manage_service ;;
    8) show_logs ;;
    0) echo ""; echo "  Sampai jumpa!"; echo ""; exit 0 ;;
    *) print_err "Pilihan tidak valid" ; sleep 1 ;;
  esac
done
