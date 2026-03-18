const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const { adminAuth } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create a new booking
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, bookingDate, timeSlot, requests } = req.body;
    if (!fullName || !email || !phone || !bookingDate) {
      return res.status(400).json({ message: 'Full name, email, phone, and date are required.' });
    }
    const booking = new Booking({ fullName, email, phone, bookingDate, timeSlot, requests });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await booking.deleteOne();
    res.json({ message: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
