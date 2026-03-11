// routes/index.js — all routes in one file
const router  = require('express').Router();
const { protect, optAuth, adminOnly } = require('../middleware/auth');
const { uploadProfile, uploadPost, uploadService } = require('../config/upload');

const auth    = require('../controllers/auth');
const users   = require('../controllers/users');
const posts   = require('../controllers/posts');
const svc     = require('../controllers/services');
const notifs  = require('../controllers/notifications');
const msgs    = require('../controllers/messages');
const search  = require('../controllers/search');
const admin   = require('../controllers/admin');

// ── Auth ─────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);
router.get ('/auth/me',       protect, auth.getMe);
router.put ('/auth/password', protect, auth.changePassword);

// ── Users ─────────────────────────────────────────
router.get ('/users/search',      users.search);
router.get ('/users/suggestions', protect, users.suggestions);
router.put ('/users/profile',     protect, uploadProfile.single('profilePicture'), users.updateProfile);
router.get ('/users/:id',         optAuth, users.getProfile);
router.get ('/users/:id/followers', users.getFollowers);
router.get ('/users/:id/following', users.getFollowing);
router.post  ('/users/:id/follow', protect, users.follow);
router.delete('/users/:id/follow', protect, users.unfollow);

// ── Posts ─────────────────────────────────────────
router.get ('/posts/feed',         protect, posts.getFeed);
router.get ('/posts/explore',      posts.getExplore);
router.get ('/posts/user/:uid',    posts.getUserPosts);
router.post('/posts',              protect, uploadPost.array('images', 5), posts.createPost);
router.delete('/posts/:id',        protect, posts.deletePost);
router.post  ('/posts/:id/react',  protect, posts.reactToPost);
router.post  ('/posts/:id/share',  protect, posts.sharePost);
router.get   ('/posts/:id/comments', posts.getComments);
router.post  ('/posts/:id/comments', protect, posts.addComment);

// ── Services ─────────────────────────────────────
router.get ('/services',            svc.getAll);
router.get ('/services/trending',   svc.getTrending);
router.get ('/services/categories', svc.getCategories);
router.get ('/services/user/:uid',  svc.getByUser);
router.post('/services',            protect, uploadService.array('images', 5), svc.create);
router.get ('/services/:id',        optAuth, svc.getById);
router.put ('/services/:id',        protect, uploadService.array('images', 5), svc.update);
router.delete('/services/:id',      protect, svc.remove);

// ── Reviews ─────────────────────────────────────
router.get   ('/reviews/:id',          svc.getReviews);
router.post  ('/reviews/:id',          protect, svc.createReview);
router.delete('/reviews/del/:id',      protect, svc.deleteReview);

// ── Notifications ─────────────────────────────────
router.get('/notifications',          protect, notifs.getAll);
router.put('/notifications/read-all', protect, notifs.markAll);
router.put('/notifications/:id/read', protect, notifs.markOne);

// ── Messages ─────────────────────────────────────
router.get ('/messages',                     protect, msgs.getConversations);
router.post('/messages',                     protect, msgs.getOrCreate);
router.get ('/messages/:id',                 protect, msgs.getMessages);
router.post('/messages/:id',                 protect, msgs.sendMessage);

// ── Search ─────────────────────────────────────
router.get('/search', search.search);

// ── Admin ─────────────────────────────────────
router.get   ('/admin/stats',            protect, adminOnly, admin.stats);
router.get   ('/admin/users',            protect, adminOnly, admin.getUsers);
router.put   ('/admin/users/:id/toggle', protect, adminOnly, admin.toggleUser);
router.get   ('/admin/posts',            protect, adminOnly, admin.getPosts);
router.delete('/admin/posts/:id',        protect, adminOnly, admin.removePost);
router.get   ('/admin/services',         protect, adminOnly, admin.getServices);
router.put   ('/admin/services/:id/feature', protect, adminOnly, admin.toggleFeatured);

module.exports = router;
