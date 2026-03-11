// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true, select: false },
  profilePicture: { type: String, default: '' },
  bio:            { type: String, default: '', maxlength: 500 },
  location:       { type: String, default: '' },
  website:        { type: String, default: '' },
  role:           { type: String, enum: ['user','admin'], default: 'user' },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function(p) { return bcrypt.compare(p, this.password); };

module.exports = mongoose.model('User', userSchema);
