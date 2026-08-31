const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const settingsSchema = new mongoose.Schema(
  {
    // =====================================================
    // STORE
    // =====================================================

    storeName: {
      type: String,
      default: 'My Shop',
      trim: true
    },

    tagline: {
      type: String,
      default: 'Add your products and start selling',
      trim: true
    },

    // =====================================================
    // PAYMENT
    // =====================================================

    upiId: {
      type: String,
      default: '',
      trim: true
    },

    payeeName: {
      type: String,
      default: '',
      trim: true
    },

    // =====================================================
    // SHIPPING / DELIVERY
    // =====================================================

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0
    },

    // =====================================================
    // CONTACT INFORMATION
    // =====================================================

    phone: {
      type: String,
      default: '',
      trim: true
    },

    whatsapp: {
      type: String,
      default: '',
      trim: true
    },

    email: {
      type: String,
      default: '',
      trim: true
    },

    address: {
      type: String,
      default: '',
      trim: true
    },

    city: {
      type: String,
      default: '',
      trim: true
    },

    state: {
      type: String,
      default: '',
      trim: true
    },

    pincode: {
      type: String,
      default: '',
      trim: true
    },

    // =====================================================
    // SOCIAL MEDIA
    // =====================================================

    instagram: {
      type: String,
      default: '',
      trim: true
    },

    facebook: {
      type: String,
      default: '',
      trim: true
    },

    // =====================================================
    // GOOGLE MAPS
    // =====================================================

    googleMaps: {
      type: String,
      default: '',
      trim: true
    },

    // =====================================================
    // ABOUT SHOP
    // =====================================================

    aboutText: {
      type: String,
      default: '',
      trim: true
    },

    // =====================================================
    // ADMIN SECURITY
    // =====================================================

    passcodeHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);


// =====================================================
// GET OR CREATE SETTINGS
// =====================================================

settingsSchema.statics.getOrCreate = async function () {
  let settings = await this.findOne();

  if (!settings) {
    const passcodeHash = await bcrypt.hash('1234', 10);

    settings = await this.create({
      passcodeHash,
      shippingCharge: 0
    });
  }

  return settings;
};


module.exports = mongoose.model(
  'Settings',
  settingsSchema
);