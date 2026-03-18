const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/admin');

// @route   POST api/auth/register
// @desc    Register a new customer
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, name: user.name, email: user.email, id: user.id });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user/admin & get token
router.post('/login', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    let account;
    let payload;

    if (username) {
      // Admin Login
      account = await Admin.findOne({ username });
      if (!account) return res.status(400).json({ message: 'Invalid Credentials' });
      
      const isMatch = await bcrypt.compare(password, account.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });
      
      payload = { admin: { id: account.id, role: account.role } };
    } else if (email) {
      // User Login
      account = await User.findOne({ email });
      if (!account) return res.status(400).json({ message: 'Invalid Credentials' });
      
      const isMatch = await bcrypt.compare(password, account.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });
      
      payload = { user: { id: account.id, role: account.role } };
    } else {
      return res.status(400).json({ message: 'Please provide email or username' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          name: account.name || account.username,
          username: account.username,
          email: account.email,
          id: account.id,
          role: account.role
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let account;
    if (decoded.user) {
      account = await User.findById(decoded.user.id).select('-password').populate('wishlist');
    } else if (decoded.admin) {
      account = await Admin.findById(decoded.admin.id).select('-password');
    }
    
    if (!account) return res.status(404).json({ message: 'User not found' });
    res.json(account);
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
