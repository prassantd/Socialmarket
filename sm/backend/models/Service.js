const mongoose = require('mongoose');

const CATEGORIES = ['Clothing & Accessories','Electronics & Gadgets','Cleaning & Maintenance','Massage & Wellness','Renovation & Repair','Landscaping','Video Editing','Tutoring','Photography','Other'];

const schema = new mongoose.Schema({
  provider:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  category:    { type: String, required: true, enum: CATEGORIES },
  description: { type: String, required: true },
  price:       { amount: { type: Number, required: true, min: 0 }, priceType: { type: String, enum: ['fixed','hourly','negotiable'], default: 'fixed' } },
  location:    { type: String, required: true },
  contactInfo: { phone: { type: String, default: '' }, email: { type: String, default: '' }, whatsapp: { type: String, default: '' } },
  images:        [{ url: String }],
  averageRating: { type: Number, default: 0 },
  reviewsCount:  { type: Number, default: 0 },
  viewsCount:    { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },
}, { timestamps: true });

schema.statics.CATEGORIES = CATEGORIES;
module.exports = mongoose.model('Service', schema);
