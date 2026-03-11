const User    = require('../models/User');
const Post    = require('../models/Post');
const Service = require('../models/Service');
const { Review } = require('../models/index');

exports.stats = async (_req, res) => {
  try {
    const [users, posts, services, reviews] = await Promise.all([User.countDocuments(), Post.countDocuments({ isDeleted: false }), Service.countDocuments({ isActive: true }), Review.countDocuments()]);
    res.json({ stats: { users, posts, services, reviews } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUsers = async (_req, res) => {
  try { res.json({ users: await User.find().sort({ createdAt: -1 }).limit(100) }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban admin' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'banned'}`, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPosts = async (_req, res) => {
  try { res.json({ posts: await Post.find({ isDeleted: false }).populate('author','username email').sort({ createdAt: -1 }).limit(100) }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.removePost = async (req, res) => {
  try { await Post.findByIdAndUpdate(req.params.id, { isDeleted: true }); res.json({ message: 'Removed' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getServices = async (_req, res) => {
  try { res.json({ services: await Service.find().populate('provider','username').sort({ createdAt: -1 }).limit(100) }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const s = await Service.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    s.isFeatured = !s.isFeatured; await s.save();
    res.json({ message: `Service ${s.isFeatured ? 'featured' : 'unfeatured'}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
