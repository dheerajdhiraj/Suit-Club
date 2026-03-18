// seed-categories.js — Run once to add default collections to the DB
// Usage: node seed-categories.js

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

const DEFAULT_CATEGORIES = [
  {
    name: 'The Executive',
    description: 'Timeless sophistication for the modern leader.',
    imageUrl: '/assets/20549.jpg',
  },
  {
    name: 'Wedding Luxe',
    description: 'Make your day unforgettable with bespoke elegance.',
    imageUrl: '/assets/20541.jpg',
  },
  {
    name: 'Nepalese Heritage',
    description: 'Local inspiration, global craftsmanship.',
    imageUrl: '/assets/20547.jpg',
  },
  {
    name: 'Black Tie',
    description: 'Command every room in a perfectly tailored tuxedo.',
    imageUrl: '/assets/20543.jpg',
  },
  {
    name: 'Smart Casual',
    description: 'Relaxed refinement for weekends and casual gatherings.',
    imageUrl: '/assets/20545.jpg',
  },
  {
    name: 'Festive Collection',
    description: 'Vibrant fabrics and rich textures for every celebration.',
    imageUrl: '/assets/20536.jpg',
  },
  {
    name: 'Slim Fit Modern',
    description: 'Contemporary cuts for the fashion-forward gentleman.',
    imageUrl: '/assets/20545.jpg',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let added = 0;
    let skipped = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await Category.findOne({ name: cat.name });
      if (existing) {
        await Category.findByIdAndUpdate(existing._id, cat);
        console.log(`  ↻ Updated "${cat.name}"`);
        skipped++; // Using skipped count for updates to keep it simple
      } else {
        await Category.create(cat);
        console.log(`  ✓ Added "${cat.name}"`);
        added++;
      }
    }

    console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
