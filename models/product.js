const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number
  },
  imageUrl: {
    type: String
  },
  materialQuality: {
    type: String
  },
  style: {
    type: String
  },
  likes: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    enum: ['', 'New Arrival', 'Bestseller', 'Limited Edition', 'Sale'],
    default: ''
  },
  galleryImages: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
