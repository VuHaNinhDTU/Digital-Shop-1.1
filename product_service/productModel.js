const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  farmerId: String, // Legacy field - will be replaced by sellerId
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: String,
  imageUrls: [{ type: String }],
  unit: { type: String, default: 'kg' },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  // Inventory tracking
  inventory: {
    stock: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 }
  },
  // Product details
  origin: String,
  isOrganic: { type: Boolean, default: false },
  certifications: [String],
  // Performance metrics
  views: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 5.0 },
    total: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  qrCode: String,
  blockchainHash: String,
  aiAnalysisResult: mongoose.Schema.Types.Mixed
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 