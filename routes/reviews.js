const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const { adminAuth } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Add a review for a product
router.post('/', async (req, res) => {
  try {
    const { product, reviewerName, rating, comment } = req.body;
    if (!product || !reviewerName || !rating) {
      return res.status(400).json({ message: 'Product, reviewer name, and rating are required.' });
    }
    const review = new Review({ product, reviewerName, rating: Number(rating), comment });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/reviews?productId=xxx
// @desc    Get reviews for a product
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.productId) query.product = req.query.productId;
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/reviews/stats/:productId
// @desc    Get average rating + count for a product
router.get('/stats/:productId', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length === 0) return res.json({ avgRating: 0, count: 0 });
    res.json({ avgRating: Math.round(stats[0].avgRating * 10) / 10, count: stats[0].count });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await review.deleteOne();
    res.json({ message: 'Review removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
