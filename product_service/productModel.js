const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  farmerId: String,
  imageUrl: String,
  imageUrls: [{ type: String }],
  unit: { type: String, default: 'kg' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  qrCode: String,
  blockchainHash: String,
  aiAnalysisResult: mongoose.Schema.Types.Mixed
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 