'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');

const { connectDB }  = require('./src/config/database');
const rateLimit      = require('./src/middleware/rateLimit');
const cache          = require('./src/utils/cache');
const { AppSetting } = require('./src/models/index');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // dihandle frontend
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:       process.env.CORS_ORIGIN || '*',
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders:['Content-Type', 'Authorization'],
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(rateLimit(300));   // 300 req/menit per IP

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  etag:  true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else if (/\.(css|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');   // 7 hari
    } else if (/\.(png|jpg|jpeg|gif|ico|svg|webp)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');  // 30 hari
    }
  },
}));

// ─── Public API ───────────────────────────────────────────────────────────────
app.get('/api/app-identity', async (req, res) => {
  try {
    const cached = cache.get('app-identity');
    if (cached) return res.json({ success: true, data: cached });

    const row  = await AppSetting.findOne({ where: { key: 'identity' } });
    const data = row?.value || { name: 'E-Journal SMK', tagline: 'Sistem Jurnal Digital Guru', logo: '' };
    cache.set('app-identity', data, 5 * 60_000);
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: { name: 'E-Journal SMK', tagline: 'Sistem Jurnal Digital Guru', logo: '' } });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    db:        'connected',
    uptime:    Math.floor(process.uptime()),
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || '2.0.0',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const { protect, adminOnly } = require('./src/middleware/auth');

// Auth — rate limit ketat untuk login
app.use('/api/auth', rateLimit(15), require('./src/routes/auth'));

// Sync dari SDMS — hanya admin
app.use('/api/sync', require('./src/routes/sync'));

// Admin
app.use('/api/admin',        require('./src/routes/admin'));
app.use('/api/admin/kelas',  adminOnly, require('./src/routes/kelas'));
app.use('/api/admin/siswa',  adminOnly, require('./src/routes/siswa'));

// Public portal siswa
app.use('/api/siswa-portal', require('./src/routes/siswaPortal'));

// Wali kelas — auth ditangani di dalam route file
app.use('/api/wali-kelas',   require('./src/routes/waliKelas'));

// Protected — harus login sebagai guru
app.use('/api/kelas',         protect, require('./src/routes/kelas'));
app.use('/api/siswa',         protect, require('./src/routes/siswa'));
app.use('/api/guru-kelas',    protect, require('./src/routes/guruKelas'));
app.use('/api/mapping-mapel', protect, require('./src/routes/mappingMapel'));
app.use('/api/absensi',       protect, require('./src/routes/absensi'));
app.use('/api/nilai',         protect, require('./src/routes/nilai'));
app.use('/api/sikap',         protect, require('./src/routes/sikap'));
app.use('/api/jurnal',        protect, require('./src/routes/jurnal'));
app.use('/api/jadwal',        protect, require('./src/routes/jadwal'));
app.use('/api/mindmap',       protect, require('./src/routes/mindmap'));
app.use('/api/profil',        protect, require('./src/routes/profil'));
app.use('/api/config',        protect, require('./src/routes/config'));

// ─── Frontend SPA routes ──────────────────────────────────────────────────────
app.get('/login',          (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/sso.html',       (req, res) => res.sendFile(path.join(__dirname, 'public', 'sso.html')));
// SSO callback — SDMS redirect ke /sso/callback?token=xxx
// Forward ke handler di /api/auth/sso
app.get('/sso/callback',   (req, res) => {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(307, `/api/auth/sso${qs}`);
});
app.get('/admin',          (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/app',            (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/absensi-kelas',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'absensi-kelas.html')));
app.get('/siswa-materi',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'siswa-materi.html')));
app.get('/siswa',          (req, res) => res.sendFile(path.join(__dirname, 'public', 'siswa.html')));
app.get('/',               (req, res) => res.sendFile(path.join(__dirname, 'public', 'index-landing.html')));
app.get('*',               (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ success: false, message: 'File terlalu besar. Maksimal 5MB.' });
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError')
    return res.status(400).json({ success: false, message: err.message });
  res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
});

// ─── Process safety ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => console.error('⚠️  Unhandled Rejection:', reason));
process.on('uncaughtException',  (err)    => console.error('⚠️  Uncaught Exception:', err.message));

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 E-Journal SMK v2.0 berjalan di port ${PORT}`);
    console.log(`📱 Akses: http://localhost:${PORT}`);
    console.log(`🌿 Mode: ${process.env.NODE_ENV || 'development'}\n`);
  });

  server.setTimeout(30_000);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout   = 66_000;

  const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} diterima. Menutup server...`);
    server.close(async () => {
      const { sequelize } = require('./src/config/database');
      await sequelize.close();
      console.log('✅ Server ditutup dengan bersih.');
      process.exit(0);
    });
    setTimeout(() => { console.error('❌ Force exit.'); process.exit(1); }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
});
