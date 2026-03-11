const Service = require('../models/Service');
const { Review, Notification } = require('../models/index');

const recalcRating = async (serviceId) => {
  const all = await Review.find({ service: serviceId });
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
  await Service.findByIdAndUpdate(serviceId, { averageRating: Math.round(avg * 10) / 10, reviewsCount: all.length });
};

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location) filter.location = { $regex: req.query.location, $options: 'i' };
    let sort = { createdAt: -1 };
    if (req.query.sort === 'rating')     sort = { averageRating: -1 };
    if (req.query.sort === 'price_asc')  sort = { 'price.amount':  1 };
    if (req.query.sort === 'price_desc') sort = { 'price.amount': -1 };
    const [services, total] = await Promise.all([
      Service.find(filter).populate('provider', 'username profilePicture').sort(sort).skip((page-1)*12).limit(12),
      Service.countDocuments(filter)
    ]);
    res.json({ services, total, hasMore: page * 12 < total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getTrending = async (_req, res) => {
  try {
    const services = await Service.find({ isActive: true }).populate('provider','username profilePicture').sort({ viewsCount: -1, averageRating: -1 }).limit(6);
    res.json({ services });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true }).populate('provider', 'username profilePicture bio location followersCount');
    if (!service) return res.status(404).json({ message: 'Not found' });
    await Service.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    const userReview = req.user ? await Review.findOne({ service: req.params.id, reviewer: req.user._id }) : null;
    res.json({ service, userReview });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, category, description, price, priceType, location, phone, email: cEmail, whatsapp } = req.body;
    if (!title || !category || !description || !price || !location)
      return res.status(400).json({ message: 'Fill all required fields' });
    const images = (req.files || []).map(f => ({ url: `/uploads/services/${f.filename}` }));
    const service = await Service.create({
      provider: req.user._id, title, category, description,
      price: { amount: Number(price), priceType: priceType || 'fixed' },
      location, contactInfo: { phone: phone||'', email: cEmail||'', whatsapp: whatsapp||'' }, images
    });
    await service.populate('provider', 'username profilePicture');
    res.status(201).json({ service });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true });
    if (!service) return res.status(404).json({ message: 'Not found' });
    if (service.provider.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const fields = ['title','description','location','category'];
    fields.forEach(f => { if (req.body[f]) service[f] = req.body[f]; });
    if (req.body.price)    service.price.amount    = Number(req.body.price);
    if (req.body.priceType) service.price.priceType = req.body.priceType;
    if (req.body.phone)    service.contactInfo.phone    = req.body.phone;
    if (req.body.email)    service.contactInfo.email    = req.body.email;
    if (req.body.whatsapp) service.contactInfo.whatsapp = req.body.whatsapp;
    if (req.files?.length) service.images = [...service.images, ...req.files.map(f => ({ url: `/uploads/services/${f.filename}` }))];
    await service.save();
    await service.populate('provider', 'username profilePicture');
    res.json({ service });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true });
    if (!service) return res.status(404).json({ message: 'Not found' });
    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await Service.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getByUser = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.uid, isActive: true }).populate('provider','username profilePicture').sort({ createdAt: -1 });
    res.json({ services });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCategories = (_req, res) => res.json({ categories: Service.schema.statics.CATEGORIES });

// Reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.id }).populate('reviewer','username profilePicture').sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createReview = async (req, res) => {
  try {
    const { rating, content } = req.body;
    if (!rating || !content) return res.status(400).json({ message: 'Rating and content required' });
    const service = await Service.findOne({ _id: req.params.id, isActive: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.provider.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot review own service' });
    const exists = await Review.findOne({ service: req.params.id, reviewer: req.user._id });
    if (exists) return res.status(400).json({ message: 'Already reviewed' });
    const review = await Review.create({ service: req.params.id, reviewer: req.user._id, rating: Number(rating), content });
    await recalcRating(req.params.id);
    await review.populate('reviewer','username profilePicture');
    await Notification.create({ recipient: service.provider, sender: req.user._id, type: 'review', message: `${req.user.username} left a ${rating}★ review`, link: `/services/${service._id}` });
    res.status(201).json({ review });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await review.deleteOne();
    await recalcRating(review.service);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
