const User = require('../models/User');
const { Follower, Notification } = require('../models/index');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isFollowing = req.user ? !!(await Follower.findOne({ follower: req.user._id, following: user._id })) : false;
    res.json({ user, isFollowing });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateProfile = async (req, res) => {
  try {
    const { username, bio, location, website } = req.body;
    const updates = {};
    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: 'Username taken' });
      updates.username = username;
    }
    if (bio      !== undefined) updates.bio      = bio;
    if (location !== undefined) updates.location = location;
    if (website  !== undefined) updates.website  = website;
    if (req.file) updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const follow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot follow yourself' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const exists = await Follower.findOne({ follower: req.user._id, following: req.params.id });
    if (exists) return res.status(400).json({ message: 'Already following' });
    await Follower.create({ follower: req.user._id, following: req.params.id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: 1 } });
    await Notification.create({ recipient: req.params.id, sender: req.user._id, type: 'follow', message: `${req.user.username} started following you`, link: `/profile/${req.user._id}` });
    res.json({ isFollowing: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const unfollow = async (req, res) => {
  try {
    const del = await Follower.findOneAndDelete({ follower: req.user._id, following: req.params.id });
    if (!del) return res.status(400).json({ message: 'Not following' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } });
    res.json({ isFollowing: false });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getFollowers = async (req, res) => {
  try {
    const docs = await Follower.find({ following: req.params.id }).populate('follower', 'username profilePicture bio');
    res.json({ users: docs.map(d => d.follower) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getFollowing = async (req, res) => {
  try {
    const docs = await Follower.find({ follower: req.params.id }).populate('following', 'username profilePicture bio');
    res.json({ users: docs.map(d => d.following) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const suggestions = async (req, res) => {
  try {
    const following = await Follower.find({ follower: req.user._id }).select('following');
    const exclude = [...following.map(f => f.following), req.user._id];
    const users = await User.find({ _id: { $nin: exclude }, isActive: true })
      .select('username profilePicture bio followersCount').sort({ followersCount: -1 }).limit(6);
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const search = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ message: 'Query required' });
    const rx = { $regex: q, $options: 'i' };
    const users = await User.find({ $or: [{ username: rx }, { bio: rx }], isActive: true })
      .select('username profilePicture bio followersCount').limit(20);
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getProfile, updateProfile, follow, unfollow, getFollowers, getFollowing, suggestions, search };
