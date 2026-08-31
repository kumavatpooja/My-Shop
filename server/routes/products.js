const express = require('express');
const Product = require('../models/Product');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['Bags', 'Jewelry', 'Clothes', 'Other'];

function cleanImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .filter((url) => typeof url === 'string' && url.trim())
    .map((url) => url.trim())
    .slice(0, 8);
}

function cleanBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function paginationResponse(products, page, limit, total) {
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

// =====================================================
// GET PRODUCTS
//
// Examples:
//   GET /api/products?limit=8&featured=true
//   GET /api/products?limit=8&newArrival=true
//   GET /api/products?limit=8&category=Clothes
//   GET /api/products?page=2&limit=24&search=kurta
//
// The old /api/products request still returns an array so any
// older part of the app keeps working.
// =====================================================
router.get('/', async (req, res) => {
  try {
    const hasQuery = Object.keys(req.query).length > 0;

    if (!hasQuery) {
      const products = await Product.find()
        .sort({ createdAt: -1 })
        .lean();
      return res.json(products);
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      48,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
    );

    const filter = {};

    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    if (req.query.featured === 'true') {
      filter.featured = true;
    }

    if (req.query.newArrival === 'true') {
      filter.newArrival = true;
    }

    const search = String(req.query.search || '').trim();
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    return res.json(paginationResponse(products, page, limit, total));
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Could not load products.' });
  }
});

// =====================================================
// GET ONE PRODUCT
// =====================================================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(400).json({ error: 'Invalid product ID.' });
  }
});

// =====================================================
// CREATE PRODUCT
// =====================================================
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images,
      videoUrl,
      category,
      featured,
      newArrival
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Enter a product name.' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'Enter a valid price greater than 0.' });
    }

    const product = await Product.create({
      name: name.trim(),
      price: numericPrice,
      description: (description || '').trim(),
      images: cleanImages(images),
      videoUrl: (videoUrl || '').trim(),
      category: CATEGORIES.includes(category) ? category : 'Other',
      featured: cleanBoolean(featured),
      newArrival: cleanBoolean(newArrival)
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Could not add product.' });
  }
});

// =====================================================
// UPDATE PRODUCT
// =====================================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images,
      videoUrl,
      category,
      featured,
      newArrival
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Enter a product name.' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'Enter a valid price greater than 0.' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        price: numericPrice,
        description: (description || '').trim(),
        images: cleanImages(images),
        videoUrl: (videoUrl || '').trim(),
        category: CATEGORIES.includes(category) ? category : 'Other',
        featured: cleanBoolean(featured),
        newArrival: cleanBoolean(newArrival)
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(400).json({ error: 'Could not save product changes.' });
  }
});

// =====================================================
// DELETE PRODUCT
// =====================================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(400).json({ error: 'Could not delete product.' });
  }
});

module.exports = router;
