const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  timeSlot: { type: String },
  requests: { type: String },
  referenceNumber: { type: String, unique: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

// Auto-generate reference number before save
bookingSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const date = new Date();
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.referenceNumber = `SC-${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
