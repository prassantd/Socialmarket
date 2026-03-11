const Post    = require('../models/Post');
const Comment = require('../models/Comment');
const { Follower, Notification } = require('../models/index');

const withReaction = (post, userId) => {
  const obj = post.toObject ? post.toObject() : { ...post };
  const r = post.reactions?.find(r => r.user?.toString() === userId?.toString());
  obj.userReaction   = r ? r.type : null;
  obj.reactionsCount = post.reactions?.length || 0;
  return obj;
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;
    const following = await Follower.find({ follower: req.user._id }).select('following');
    const ids = [...following.map(f => f.following), req.user._id];
    const posts = await Post.find({ author: { $in: ids }, isDeleted: false })
      .populate('author', 'username profilePicture')
      .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'username profilePicture' } })
      .sort({ createdAt: -1 }).skip(skip).limit(10);
    res.json({ posts: posts.map(p => withReaction(p, req.user._id)), hasMore: posts.length === 10 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getExplore = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const posts = await Post.find({ isDeleted: false, visibility: 'public' })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 }).skip((page - 1) * 10).limit(10);
    res.json({ posts, hasMore: posts.length === 10 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const createPost = async (req, res) => {
  try {
    const { content, visibility } = req.body;
    if (!content?.trim() && !req.files?.length)
      return res.status(400).json({ message: 'Post needs content or image' });
    const images = (req.files || []).map(f => ({ url: `/uploads/posts/${f.filename}` }));
    const post = await Post.create({ author: req.user._id, content: content || '', images, visibility: visibility || 'public' });
    await post.populate('author', 'username profilePicture');
    res.status(201).json({ post });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await Post.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const reactToPost = async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const idx = post.reactions.findIndex(r => r.user?.toString() === req.user._id.toString());
    if (idx !== -1) {
      if (post.reactions[idx].type === type) post.reactions.splice(idx, 1);
      else post.reactions[idx].type = type;
    } else {
      post.reactions.push({ user: req.user._id, type });
      if (post.author.toString() !== req.user._id.toString())
        await Notification.create({ recipient: post.author, sender: req.user._id, type: 'reaction', message: `${req.user.username} reacted to your post`, link: `/post/${post._id}` });
    }
    await post.save();
    const r = post.reactions.find(r => r.user?.toString() === req.user._id.toString());
    res.json({ reactionsCount: post.reactions.length, userReaction: r ? r.type : null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const sharePost = async (req, res) => {
  try {
    const original = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!original) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.create({ author: req.user._id, content: req.body.comment || '', sharedFrom: original._id });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } });
    await post.populate('author', 'username profilePicture');
    if (original.author.toString() !== req.user._id.toString())
      await Notification.create({ recipient: original.author, sender: req.user._id, type: 'share', message: `${req.user.username} shared your post`, link: `/post/${post._id}` });
    res.status(201).json({ post });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isDeleted: false })
      .populate('author', 'username profilePicture').sort({ createdAt: 1 });
    res.json({ comments });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const addComment = async (req, res) => {
  try {
    if (!req.body.content?.trim()) return res.status(400).json({ message: 'Empty comment' });
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({ post: req.params.id, author: req.user._id, content: req.body.content });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    await comment.populate('author', 'username profilePicture');
    if (post.author.toString() !== req.user._id.toString())
      await Notification.create({ recipient: post.author, sender: req.user._id, type: 'comment', message: `${req.user.username} commented on your post`, link: `/post/${post._id}` });
    res.status(201).json({ comment });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.uid, isDeleted: false })
      .populate('author', 'username profilePicture').sort({ createdAt: -1 });
    res.json({ posts });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getFeed, getExplore, createPost, deletePost, reactToPost, sharePost, getComments, addComment, getUserPosts };
