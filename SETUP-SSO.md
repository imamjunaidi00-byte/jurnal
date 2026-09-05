# Setup SSO Jurnal Guru ↔ SDMS

## Di VPS — jalankan satu kali

### 1. Tambah env variable SSO ke .env jurnal
```bash
echo "" >> /home/ejournal/app/.env
echo "# SSO dari SDMS" >> /home/ejournal/app/.env
echo "SSO_SECRET=sso_secret_jurnal_smkn1kras_2026" >> /home/ejournal/app/.env
echo "SSO_APP_NAME=jurnal" >> /home/ejournal/app/.env
```

> Sesuaikan path `/home/ejournal/app/` dengan direktori instalasi jurnal di VPS.

### 2. Jalankan update dari GitHub
```bash
cd /home/ejournal/app
bash update.sh
```

Script akan otomatis:
- Pull kode terbaru (termasuk SSO callback)
- Install dependencies
- Restart aplikasi via PM2

### 3. Verifikasi
```bash
pm2 logs ejournal-smk --lines 20
```

Pastikan tidak ada error `Cannot GET /api/auth/sso`.

---

## Test SSO

Buka SDMS → App Hub → klik **Jurnal Guru**

Flow yang terjadi:
1. SDMS buat JWT token (5 menit, signed `sso_secret_jurnal_smkn1kras_2026`)
2. Browser redirect ke `https://jurnal.smkn1kras.sch.id/api/auth/sso?token=xxx`
3. Jurnal verifikasi token → cari/buat akun guru
4. Redirect ke `/sso.html#token=yyy`
5. `sso.html` simpan token ke localStorage → redirect ke `/app`
6. Guru langsung masuk tanpa login ulang ✅

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `sso_invalid` | SSO_SECRET beda antara SDMS dan jurnal | Samakan nilai `SSO_SECRET_JURNAL` (SDMS) dan `SSO_SECRET` (jurnal) |
| `sso_expired` | Token lebih dari 5 menit | Coba klik lagi dari SDMS |
| `Cannot GET /sso` | server.js belum di-update | Jalankan `bash update.sh` |
