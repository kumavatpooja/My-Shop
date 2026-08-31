const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },

    shippingCharge: { type: Number, min: 0, default: 0 },
    subtotalAmount: { type: Number, min: 0, required: true },
    totalAmount: { type: Number, min: 0, required: true },

    buyerName: { type: String, required: true, trim: true },
    buyerPhone: { type: String, required: true, trim: true },
    buyerEmail: { type: String, trim: true, default: '' },
    buyerAddress: { type: String, required: true, trim: true },
    buyerCity: { type: String, trim: true, default: '' },
    buyerState: { type: String, trim: true, default: '' },
    buyerPincode: { type: String, trim: true, default: '' },

    paymentMethod: { type: String, default: 'UPI', trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
