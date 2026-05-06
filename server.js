const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();
const { protect } = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files — KECUALI index.html (dihandle manual)
app.use(express.static(path.join(__dirname, 'public'), { 
  index: false,
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    // Jangan cache file HTML
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
  }
}));

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Public API untuk portal siswa (read-only by NISN)
app.use('/api/jadwal', require('./routes/jadwal'));
app.use('/api/mindmap', require('./routes/mindmap'));
app.use('/api/siswa-portal', require('./routes/siswaPortal'));

// Protected API — hanya guru yang login
app.use('/api/siswa', protect, require('./routes/siswa'));
app.use('/api/absensi', protect, require('./routes/absensi'));
app.use('/api/nilai', protect, require('./routes/nilai'));
app.use('/api/sikap', protect, require('./routes/sikap'));
app.use('/api/kelas', protect, require('./routes/kelas'));
app.use('/api/profil', protect, require('./routes/profil'));
app.use('/api/mapping-mapel', protect, require('./routes/mappingMapel'));
app.use('/api/jurnal', protect, require('./routes/jurnal'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend — landing page sebagai halaman utama
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/siswa.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'siswa.html'));
});
app.get('/siswa-materi.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'siswa-materi.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-landing.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📱 Akses aplikasi: http://localhost:${PORT}`);
});