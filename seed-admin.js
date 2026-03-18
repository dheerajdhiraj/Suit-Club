// seed-admin.js — Run this to set or update your Admin credentials
// Usage: node seed-admin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/admin');

// 1. ADD YOUR ADMINS HERE
const ADMINS = [
  { username: 'dheerajdhiraj91@gmail.com', password: 'Dhiraj@123' },
  { username: 'admin', password: 'password123' } // Add more objects here for more admins
];

async function seedAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const data of ADMINS) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const existing = await Admin.findOne({ username: data.username });
      if (existing) {
        existing.password = hashedPassword;
        await existing.save();
        console.log(`  ↻ Updated Admin: ${data.username}`);
      } else {
        await Admin.create({ ...data, password: hashedPassword, role: 'admin' });
        console.log(`  ✓ Created Admin: ${data.username}`);
      }
    }

    console.log('\nAll admins updated. You can now log in at http://localhost:5000/admin.html');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admins:', err.message);
    process.exit(1);
  }
}

seedAdmins();
