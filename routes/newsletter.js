const express = require('express');
const router = express.Router();
const Newsletter = require('../models/newsletter');
const { adminAuth } = require('../middleware/auth');

// @route   POST /api/newsletter
// @desc    Subscribe to newsletter
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    // Check if already subscribed
    const exists = await Newsletter.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'You are already subscribed!' });

    const sub = new Newsletter({ email });
    await sub.save();
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/newsletter
// @desc    Get all subscribers (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const subs = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/newsletter/:id
// @desc    Unsubscribe (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const sub = await Newsletter.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscriber not found' });
    await sub.deleteOne();
    res.json({ message: 'Subscriber removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
