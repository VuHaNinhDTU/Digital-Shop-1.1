const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  role: { type: String, enum: ['user', 'seller', 'admin', 'logistics'], default: 'user' },
  password: { type: String, required: true },
  status: { type: String, default: 'active' },
  // Seller-specific fields
  sellerProfile: {
    businessName: String,
    businessType: String,
    businessAddress: String,
    businessPhone: String,
    businessEmail: String,
    verification: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    commissionRate: { type: Number, default: 10 }, // 10% commission
    bankInfo: {
      bankName: String,
      accountNumber: String,
      accountHolder: String
    },
    ratings: {
      average: { type: Number, default: 5.0 },
      total: { type: Number, default: 0 }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User; 