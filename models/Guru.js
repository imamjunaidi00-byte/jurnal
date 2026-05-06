const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guruSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  nama: { type: String, required: true },
  role: { type: String, default: 'guru' }
}, { timestamps: true });

// Hash password sebelum simpan
guruSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Cek password
guruSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Guru', guruSchema);
