// controllers/notifications.js
const { Notification } = require('../models/index');

exports.getAll = async (req, res) => {
  try {
    const notifs  = await Notification.find({ recipient: req.user._id }).populate('sender','username profilePicture').sort({ createdAt: -1 }).limit(50);
    const unread  = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications: notifs, unreadCount: unread });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markAll = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'Done' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markOne = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
    res.json({ message: 'Done' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
