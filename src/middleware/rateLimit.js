'use strict';

/**
 * Simple in-memory rate limiter — tidak perlu package eksternal.
 * Cocok untuk single-process deployment (tanpa cluster/PM2 cluster mode).
 */

const store = new Map();
const WINDOW = 60 * 1000; // 1 menit

// Cleanup otomatis setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store) {
    if (now - data.start > WINDOW * 2) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * @param {number} max - max request per window per IP
 */
const rateLimit = (max) => (req, res, next) => {
  const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
  const key = `${ip}:${max}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.start > WINDOW) {
    store.set(key, { count: 1, start: now });
    return next();
  }

  entry.count++;
  if (entry.count > max) {
    const retryAfter = Math.ceil((WINDOW - (now - entry.start)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message: `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`,
    });
  }
  next();
};

module.exports = rateLimit;
