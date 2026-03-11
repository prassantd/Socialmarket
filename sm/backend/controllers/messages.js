const { Conversation, Message, Notification } = require('../models/index');

exports.getConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants','username profilePicture')
      .populate('lastMessage').sort({ lastMessageAt: -1 });
    res.json({ conversations: convs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getOrCreate = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
    let conv = await Conversation.findOne({ participants: { $all: [req.user._id, recipientId] } }).populate('participants','username profilePicture');
    if (!conv) {
      conv = await Conversation.create({ participants: [req.user._id, recipientId] });
      await conv.populate('participants','username profilePicture');
    }
    res.json({ conversation: conv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Not found' });
    const messages = await Message.find({ conversation: req.params.id }).populate('sender','username profilePicture').sort({ createdAt: 1 });
    await Message.updateMany({ conversation: req.params.id, sender: { $ne: req.user._id }, isRead: false }, { isRead: true });
    res.json({ messages });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    if (!req.body.content?.trim()) return res.status(400).json({ message: 'Empty message' });
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Not found' });
    const msg = await Message.create({ conversation: req.params.id, sender: req.user._id, content: req.body.content });
    conv.lastMessage   = msg._id;
    conv.lastMessageAt = Date.now();
    await conv.save();
    await msg.populate('sender','username profilePicture');
    const recipientId = conv.participants.find(p => p.toString() !== req.user._id.toString());
    await Notification.create({ recipient: recipientId, sender: req.user._id, type: 'message', message: `${req.user.username} sent you a message`, link: `/messages/${conv._id}` });
    res.status(201).json({ message: msg });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
