// controllers/auth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const userObj = (u) => ({ _id: u._id, username: u.username, email: u.email, profilePicture: u.profilePicture, bio: u.bio, location: u.location, website: u.website, role: u.role, followersCount: u.followersCount, followingCount: u.followingCount });

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: exists.email === email ? 'Email already used' : 'Username taken' });
    const user = await User.create({ username, email, password });
    res.status(201).json({ token: token(user._id), user: userObj(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Wrong email or password' });
    if (!user.isActive) return res.status(401).json({ message: 'Account banned' });
    res.json({ token: token(user._id), user: userObj(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: userObj(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ message: 'Wrong current password' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { register, login, getMe, changePassword };
