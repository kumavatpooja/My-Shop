const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const requireAdmin = require('../middleware/auth');

const router = express.Router();
const STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

router.post('/', async (req, res) => {
  try {
    const {
      productId,
      productName,
      productPrice,
      quantity,
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerAddress,
      buyerCity,
      buyerState,
      buyerPincode,
      paymentMethod
    } = req.body;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Choose a valid quantity.' });
    }

    if (!clean(buyerName) || !clean(buyerPhone) || !clean(buyerAddress)) {
      return res.status(400).json({ error: 'Please complete your delivery details.' });
    }

    let price = Number(productPrice);
    let resolvedProductId = null;
    let resolvedName = clean(productName);

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const product = await Product.findById(productId).lean();
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      price = Number(product.price);
      resolvedProductId = product._id;
      resolvedName = product.name;
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Product price is invalid.' });
    }

    const settings = await Settings.getOrCreate();
    const shipping = Math.max(0, Number(settings.shippingCharge) || 0);
    const subtotal = price * qty;
    const total = subtotal + shipping;

    const order = await Order.create({
      productId: resolvedProductId,
      productName: resolvedName || 'Product',
      productPrice: price,
      quantity: qty,
      shippingCharge: shipping,
      subtotalAmount: subtotal,
      totalAmount: total,
      buyerName: clean(buyerName),
      buyerPhone: clean(buyerPhone),
      buyerEmail: clean(buyerEmail),
      buyerAddress: clean(buyerAddress),
      buyerCity: clean(buyerCity),
      buyerState: clean(buyerState),
      buyerPincode: clean(buyerPincode),
      paymentMethod: clean(paymentMethod) || 'UPI'
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Could not place the order.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Could not load orders.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }
    const status = clean(req.body.status);
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(400).json({ error: 'Could not update order.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (!['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ error: 'Only shipped, delivered or cancelled orders can be deleted.' });
    }

    await order.deleteOne();
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(400).json({ error: 'Could not delete order.' });
  }
});

module.exports = router;
