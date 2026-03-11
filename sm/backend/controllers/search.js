// controllers/search.js
const User    = require('../models/User');
const Post    = require('../models/Post');
const Service = require('../models/Service');

exports.search = async (req, res) => {
  try {
    const q  = req.query.q;
    if (!q?.trim()) return res.status(400).json({ message: 'Query required' });
    const rx = { $regex: q, $options: 'i' };
    const [users, posts, services] = await Promise.all([
      User.find({ $or: [{ username: rx },{ bio: rx }], isActive: true }).select('username profilePicture bio followersCount').limit(8),
      Post.find({ content: rx, isDeleted: false, visibility: 'public' }).populate('author','username profilePicture').sort({ createdAt: -1 }).limit(8),
      Service.find({ $or: [{ title: rx },{ description: rx }], isActive: true }).populate('provider','username profilePicture').limit(8),
    ]);
    res.json({ users, posts, services });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
