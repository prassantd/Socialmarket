const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, default: '' },
  images:     [{ url: String }],
  reactions:  [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, type: { type: String, enum: ['like','love','haha','wow','sad','angry'] } }],
  commentsCount: { type: Number, default: 0 },
  sharesCount:   { type: Number, default: 0 },
  sharedFrom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  visibility:    { type: String, enum: ['public','private'], default: 'public' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
