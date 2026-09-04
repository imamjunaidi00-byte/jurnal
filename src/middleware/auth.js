'use strict';

const jwt  = require('jsonwebtoken');
const { Guru } = require('../models/index');

// ─── In-Memory Token Cache (5 menit TTL) ──────────────────────────────────────
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of tokenCache) {
    if (now > v.expiresAt) tokenCache.delete(k);
  }
}, 10 * 60 * 1000);

const JWT_SECRET = () => process.env.JWT_SECRET || 'change_me_in_production';

// Ambil guru dari cache atau DB
async function resolveGuru(token) {
  const cached = tokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) return cached.guru;

  const decoded = jwt.verify(token, JWT_SECRET());
  if (decoded.type === 'pengabsen') return null; // bukan guru

  const guru = await Guru.findByPk(decoded.id, {
    attributes: { exclude: ['password'] },
    raw: true,
  });
  if (!guru) return null;

  tokenCache.set(token, { guru, expiresAt: Date.now() + TOKEN_CACHE_TTL });
  return guru;
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
}

// ─── Middleware: akses guru yang sudah login ────────────────────────────────
const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });

  try {
    const guru = await resolveGuru(token);
    if (!guru) return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    req.guru  = guru;
    req.token = token;
    next();
  } catch {
    tokenCache.delete(token);
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
};

// ─── Middleware: khusus admin ──────────────────────────────────────────────
const adminOnly = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });

  try {
    const guru = await resolveGuru(token);
    if (!guru) return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    if (guru.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' });
    req.guru  = guru;
    req.token = token;
    next();
  } catch {
    tokenCache.delete(token);
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
};

// ─── Middleware: akses pengabsen kelas ────────────────────────────────────
const protectPengabsen = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    if (decoded.type !== 'pengabsen')
      return res.status(403).json({ success: false, message: 'Akses hanya untuk pengabsen kelas.' });

    const { PengabsenKelas } = require('../models/index');
    const pengabsen = await PengabsenKelas.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }, raw: true,
    });
    if (!pengabsen || !pengabsen.aktif)
      return res.status(401).json({ success: false, message: 'Akun pengabsen tidak aktif atau tidak ditemukan.' });

    req.pengabsen = pengabsen;
    req.token     = token;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
};

// ─── Helpers untuk invalidasi cache ──────────────────────────────────────
const invalidateToken = (token) => tokenCache.delete(token);

const invalidateGuruTokens = (guruId) => {
  const gid = String(guruId);
  for (const [token, val] of tokenCache) {
    if (val.guru && String(val.guru.id) === gid) tokenCache.delete(token);
  }
};

// ─── Generate JWT ──────────────────────────────────────────────────────────
const generateToken = (payload, expiresIn = null) =>
  jwt.sign(payload, JWT_SECRET(), {
    expiresIn: expiresIn || process.env.JWT_EXPIRE || '30d',
  });

module.exports = { protect, adminOnly, protectPengabsen, invalidateToken, invalidateGuruTokens, generateToken };
