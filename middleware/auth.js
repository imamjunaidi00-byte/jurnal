const jwt = require('jsonwebtoken');
const Guru = require('../models/Guru');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_jwt_default');
    req.guru = await Guru.findById(decoded.id).select('-password');
    if (!req.guru) return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
};

module.exports = { protect };
