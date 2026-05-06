const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Guru = require('../models/Guru');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'rahasia_jwt_default',
  { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

// POST /api/auth/register — buat akun guru (hanya jika belum ada akun)
router.post('/register', async (req, res) => {
  try {
    const { username, password, nama } = req.body;
    if (!username || !password || !nama)
      return res.status(400).json({ success: false, message: 'Username, password, dan nama wajib diisi.' });

    // Cek apakah sudah ada akun
    const existing = await Guru.findOne({ username });
    if (existing)
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });

    const guru = await Guru.create({ username, password, nama });
    const token = signToken(guru._id);

    res.status(201).json({ success: true, token, data: { id: guru._id, username: guru.username, nama: guru.nama } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });

    const guru = await Guru.findOne({ username });
    if (!guru || !(await guru.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const token = signToken(guru._id);
    res.json({ success: true, token, data: { id: guru._id, username: guru.username, nama: guru.nama } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/auth/me — cek token masih valid
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.guru });
});

// PUT /api/auth/password — ganti password
router.put('/password', protect, async (req, res) => {
  try {
    const { passwordLama, passwordBaru } = req.body;
    const guru = await Guru.findById(req.guru._id);
    if (!(await guru.matchPassword(passwordLama)))
      return res.status(400).json({ success: false, message: 'Password lama salah.' });
    guru.password = passwordBaru;
    await guru.save();
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/auth/username — ganti username
router.put('/username', protect, async (req, res) => {
  try {
    const { usernameBaru, password } = req.body;
    if (!usernameBaru || !password)
      return res.status(400).json({ success: false, message: 'Username baru dan password wajib diisi.' });

    const guru = await Guru.findById(req.guru._id);
    if (!(await guru.matchPassword(password)))
      return res.status(400).json({ success: false, message: 'Password salah.' });

    const existing = await Guru.findOne({ username: usernameBaru.toLowerCase() });
    if (existing && existing._id.toString() !== guru._id.toString())
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });

    guru.username = usernameBaru.toLowerCase();
    await guru.save();
    res.json({ success: true, message: 'Username berhasil diubah.', data: { username: guru.username } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/auth/check-setup — cek apakah sudah ada akun guru
router.get('/check-setup', async (req, res) => {
  const count = await Guru.countDocuments();
  res.json({ success: true, hasAccount: count > 0 });
});

// GET /api/auth/accounts — daftar semua akun (protected)
router.get('/accounts', protect, async (req, res) => {
  try {
    const accounts = await Guru.find().select('-password').sort({ createdAt: 1 });
    res.json({ success: true, data: accounts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/auth/accounts/:id — hapus akun (tidak bisa hapus diri sendiri)
router.delete('/accounts/:id', protect, async (req, res) => {
  try {
    if (req.params.id === req.guru._id.toString())
      return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun yang sedang digunakan.' });
    const guru = await Guru.findByIdAndDelete(req.params.id);
    if (!guru) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    res.json({ success: true, message: `Akun "${guru.username}" berhasil dihapus.` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
