const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null, 'category-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// @route   GET api/categories
// @desc    Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories
// @desc    Create a category
// @access  Private
router.post('/', [adminAuth, upload.single('image')], async (req, res) => {
  try {
    const { name, description, manualImageUrl } = req.body;
    let imageUrl = manualImageUrl || '';
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newCategory = new Category({
      name,
      description,
      imageUrl
    });

    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', [adminAuth, upload.single('image')], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, description, manualImageUrl } = req.body;
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (manualImageUrl) category.imageUrl = manualImageUrl;
    if (req.file) category.imageUrl = `/uploads/${req.file.filename}`;

    const updated = await category.save();
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Category not found' });
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/categories/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    // Remove this category from all products
    const Product = require('../models/product');
    await Product.updateMany(
      { categories: category._id },
      { $pull: { categories: category._id } }
    );

    await category.deleteOne();
    res.json({ message: 'Category removed and unlinked from products' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Category not found' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;
