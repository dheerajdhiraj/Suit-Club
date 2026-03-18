const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const multiUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 }
]);

// @route   GET api/products
// @desc    Get all products or filter by category
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.query.categoryId) {
      query.categories = req.query.categoryId;
    }
    const products = await Product.find(query).populate('categories', 'name').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categories', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products
// @access  Private
router.post('/', [adminAuth, multiUpload], async (req, res) => {
  try {
    const { categories, title, description, price, materialQuality, style, badge, manualImageUrl, manualGalleryImages } = req.body;
    
    // categories logic
    let catArray = [];
    if (typeof categories === 'string') {
      catArray = categories.split(',').map(id => id.trim());
    } else if (Array.isArray(categories)) {
      catArray = categories;
    }
    
    let imageUrl = manualImageUrl || '';
    let galleryImages = [];
    
    if (manualGalleryImages) {
      if (typeof manualGalleryImages === 'string') {
        galleryImages = manualGalleryImages.split(',').map(img => img.trim()).filter(img => img);
      } else if (Array.isArray(manualGalleryImages)) {
        galleryImages = manualGalleryImages;
      }
    }
    
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        imageUrl = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.galleryImages) {
        const uploadedGallery = req.files.galleryImages.map(file => `/uploads/${file.filename}`);
        galleryImages = [...galleryImages, ...uploadedGallery];
      }
    }

    const newProduct = new Product({
      categories: catArray,
      title,
      description,
      price: price ? Number(price) : null,
      imageUrl,
      galleryImages,
      materialQuality,
      style,
      badge: badge || ''
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id/like
// @desc    Increment like count
router.put('/:id/like', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.likes += 1;
    await product.save();
    res.json({ likes: product.likes });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', [adminAuth, multiUpload], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { title, categories, price, description, materialQuality, style, badge, removeImages, manualImageUrl, manualGalleryImages } = req.body;
    if (title) product.title = title;
    // ... existing categories, price, etc.
    if (categories) {
      if (typeof categories === 'string') {
        product.categories = categories.split(',').map(id => id.trim());
      } else if (Array.isArray(categories)) {
        product.categories = categories;
      }
    }
    if (price !== undefined) product.price = price ? Number(price) : null;
    if (description !== undefined) product.description = description;
    if (materialQuality !== undefined) product.materialQuality = materialQuality;
    if (style !== undefined) product.style = style;
    if (badge !== undefined) product.badge = badge;
    
    // Manual Paths
    if (manualImageUrl) {
      product.imageUrl = manualImageUrl;
    }
    if (manualGalleryImages) {
      const manualArray = typeof manualGalleryImages === 'string' 
        ? manualGalleryImages.split(',').map(img => img.trim()).filter(img => img)
        : manualGalleryImages;
      product.galleryImages = [...(product.galleryImages || []), ...manualArray];
    }
    
    // Handling new uploaded images
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        product.imageUrl = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.galleryImages) {
        const newGallery = req.files.galleryImages.map(file => `/uploads/${file.filename}`);
        product.galleryImages = [...(product.galleryImages || []), ...newGallery];
      }
    }

    // Optional: Removing specific gallery images (passed as indices or URLs)
    if (removeImages) {
      const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      product.galleryImages = product.galleryImages.filter(img => !toRemove.includes(img));
    }

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;
