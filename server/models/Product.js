const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    // Up to 8 product photos
    images: {
      type: [String],
      default: []
    },

    // Optional YouTube/Vimeo/direct video URL
    videoUrl: {
      type: String,
      trim: true,
      default: ''
    },

    category: {
      type: String,
      enum: ['Bags', 'Jewelry', 'Clothes', 'Other'],
      default: 'Other'
    },

    // Controls whether the product is shown in the home-page featured section.
    featured: {
      type: Boolean,
      default: false,
      index: true
    },

    // Controls whether the product is shown in the New Arrivals section.
    newArrival: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ featured: 1, createdAt: -1 });
productSchema.index({ newArrival: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
