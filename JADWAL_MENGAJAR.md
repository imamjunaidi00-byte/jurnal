# Fitur Jadwal Mengajar - E-Journal Guru SMK

## 📋 Deskripsi
Fitur jadwal mengajar telah berhasil ditambahkan ke aplikasi E-Journal Guru SMK. Fitur ini memungkinkan guru untuk mengelola jadwal mengajar mereka dengan lengkap, termasuk menambah, mengedit, menghapus, dan melihat jadwal per hari.

## 🚀 Fitur yang Ditambahkan

### 1. **Model Database (Jadwal.js)**
- Schema MongoDB untuk menyimpan data jadwal mengajar
- Validasi data otomatis (hari, jam, mata pelajaran, dll.)
- Index untuk mencegah konflik jadwal (ruangan dan guru)
- Relasi dengan model Kelas

### 2. **API Endpoints (jadwalController.js & routes/jadwal.js)**
- `GET /api/jadwal` - Mendapatkan semua jadwal dengan filter
- `POST /api/jadwal` - Membuat jadwal baru dengan validasi konflik
- `GET /api/jadwal/:id` - Mendapatkan jadwal berdasarkan ID
- `PUT /api/jadwal/:id` - Update jadwal dengan validasi konflik
- `DELETE /api/jadwal/:id` - Menghapus jadwal
- `GET /api/jadwal/hari/:hari` - Mendapatkan jadwal berdasarkan hari
- `GET /api/jadwal/guru/:guru` - Mendapatkan jadwal berdasarkan guru
- `GET /api/jadwal/kelas/:kelasId` - Mendapatkan jadwal berdasarkan kelas

### 3. **Frontend Interface**
- **Menu Sidebar**: Tambahan menu "Jadwal Mengajar" dengan ikon kalender
- **Halaman Jadwal**: Interface grid yang menampilkan jadwal per hari
- **Modal Form**: Form untuk tambah/edit jadwal dengan validasi
- **Filter**: Filter berdasarkan hari dan semester
- **Dashboard Integration**: Jadwal hari ini ditampilkan di dashboard

## 📊 Struktur Data Jadwal

```javascript
{
  hari: "Senin|Selasa|Rabu|Kamis|Jumat|Sabtu",
  jamMulai: "07:00", // Format HH:MM
  jamSelesai: "08:30", // Format HH:MM
  mataPelajaran: "Dasar-Dasar TKJ",
  kelas: ObjectId, // Referensi ke model Kelas
  guru: "Drs. Ahmad Santoso",
  ruangan: "Lab Komputer 1",
  semester: "Ganjil|Genap",
  tahunAjaran: "2026/2027",
  aktif: true,
  catatan: "Catatan tambahan (opsional)"
}
```

## 🔧 Validasi dan Fitur Keamanan

### 1. **Validasi Konflik Ruangan**
- Sistem mencegah penjadwalan ruangan yang sama di waktu yang bersamaan
- Validasi overlap waktu yang akurat

### 2. **Validasi Konflik Guru**
- Sistem mencegah guru mengajar di waktu yang bersamaan
- Validasi berlaku untuk tahun ajaran dan semester yang sama

### 3. **Validasi Data**
- Format jam harus HH:MM (regex validation)
- Hari harus dari enum yang ditentukan
- Semester harus Ganjil atau Genap
- Semua field wajib terisi kecuali catatan

## 🎨 Antarmuka Pengguna

### 1. **Halaman Jadwal Mengajar**
- **Grid Layout**: Menampilkan jadwal dalam bentuk kartu per hari
- **Color Coding**: Setiap hari memiliki warna header yang berbeda
- **Responsive Design**: Menyesuaikan dengan berbagai ukuran layar
- **Hover Effects**: Animasi smooth saat hover

### 2. **Modal Form Jadwal**
- **Dual Purpose**: Satu modal untuk tambah dan edit
- **Auto-fill**: Data guru, semester, dan tahun ajaran terisi otomatis
- **Dropdown Kelas**: Terintegrasi dengan data kelas yang ada
- **Validasi Real-time**: Feedback langsung untuk input yang salah

### 3. **Dashboard Integration**
- **Jadwal Hari Ini**: Menampilkan jadwal hari ini di dashboard
- **Status Real-time**: Menunjukkan status "Berlangsung", "Selesai", atau "Mendatang"
- **Quick Action**: Tombol langsung ke halaman absensi untuk jadwal yang sedang berlangsung

## 📱 Fitur Mobile-Friendly
- Responsive design untuk semua ukuran layar
- Touch-friendly buttons dan interface
- Optimized untuk penggunaan di tablet dan smartphone

## 🔄 Integrasi dengan Fitur Lain

### 1. **Dashboard**
- Jadwal hari ini ditampilkan dengan status real-time
- Link langsung ke halaman absensi

### 2. **Sistem Kelas**
- Otomatis membuat kelas baru jika belum ada
- Terintegrasi dengan dropdown kelas di seluruh aplikasi

### 3. **Data Guru**
- Menggunakan data guru dari konfigurasi
- Konsisten dengan sistem yang sudah ada

## 🚀 Cara Menggunakan

### 1. **Menambah Jadwal Baru**
1. Buka menu "Jadwal Mengajar"
2. Klik tombol "Tambah Jadwal"
3. Isi form dengan data yang diperlukan
4. Klik "Simpan"

### 2. **Mengedit Jadwal**
1. Di halaman jadwal, klik ikon edit (pensil) pada jadwal yang ingin diubah
2. Ubah data yang diperlukan
3. Klik "Simpan"

### 3. **Menghapus Jadwal**
1. Klik ikon hapus (tempat sampah) pada jadwal
2. Konfirmasi penghapusan

### 4. **Filter Jadwal**
- Gunakan dropdown "Semua Hari" untuk filter berdasarkan hari
- Gunakan dropdown "Semester" untuk filter berdasarkan semester

## 🔧 Teknologi yang Digunakan
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla)
- **Database**: MongoDB dengan schema validation
- **UI Framework**: Tailwind CSS dengan custom components

## 📈 Statistik dan Monitoring
- Jadwal ditampilkan di dashboard dengan status real-time
- Integrasi dengan sistem absensi untuk tracking kehadiran
- Data tersimpan dengan timestamp untuk audit trail

## 🎯 Manfaat Fitur Ini
1. **Organisasi yang Lebih Baik**: Guru dapat mengatur jadwal mengajar dengan sistematis
2. **Pencegahan Konflik**: Sistem otomatis mencegah bentrok jadwal ruangan dan guru
3. **Akses Mudah**: Interface yang user-friendly dan responsive
4. **Integrasi Seamless**: Terintegrasi dengan fitur absensi dan dashboard
5. **Data Terpusat**: Semua jadwal tersimpan dalam database yang terstruktur

## 🔮 Pengembangan Selanjutnya
- Export jadwal ke PDF/Excel
- Notifikasi reminder sebelum jam mengajar
- Integrasi dengan kalender Google/Outlook
- Fitur tukar jadwal antar guru
- Laporan statistik jam mengajar

---

**Status**: ✅ **SELESAI** - Fitur jadwal mengajar telah berhasil diimplementasi dan siap digunakan!

**Akses**: http://localhost:3001 → Menu "Jadwal Mengajar"