const mongoose = require('mongoose');

// Review
const reviewSchema = new mongoose.Schema({
  service:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  content:  { type: String, required: true },
}, { timestamps: true });
reviewSchema.index({ service: 1, reviewer: 1 }, { unique: true });
const Review = mongoose.model('Review', reviewSchema);

// Follower
const followerSchema = new mongoose.Schema({
  follower:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
followerSchema.index({ follower: 1, following: 1 }, { unique: true });
const Follower = mongoose.model('Follower', followerSchema);

// Conversation
const convSchema = new mongoose.Schema({
  participants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage:   { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });
const Conversation = mongoose.model('Conversation', convSchema);

// Message
const msgSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:      { type: String, required: true },
  isRead:       { type: Boolean, default: false },
}, { timestamps: true });
const Message = mongoose.model('Message', msgSchema);

// Notification
const notifSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:      { type: String, enum: ['follow','reaction','comment','share','review','message'], required: true },
  message:   { type: String, required: true },
  link:      { type: String, default: '/' },
  isRead:    { type: Boolean, default: false },
}, { timestamps: true });
const Notification = mongoose.model('Notification', notifSchema);

module.exports = { Review, Follower, Conversation, Message, Notification };
