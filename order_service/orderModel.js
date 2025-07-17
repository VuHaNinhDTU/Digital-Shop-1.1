const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  unit: String
});

const shippingInfoSchema = new mongoose.Schema({
  trackingId: String,
  carrier: String,
  estimatedDelivery: String,
  address: String,
  status: String
});

const paymentReceiptSchema = new mongoose.Schema({
  receiptId: String,
  amount: Number,
  timestamp: String
});

const orderSchema = new mongoose.Schema({
  orderDate: { type: Date, default: Date.now },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  deliveryDate: Date,
  trackingId: String,
  blockchainHash: String,
  // Seller information
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerStatus: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped'], default: 'pending' },
  sellerNotes: String,
  // Commission tracking
  commission: {
    rate: { type: Number, default: 10 },
    amount: Number,
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  shippingInfo: shippingInfoSchema,
  paymentReceipt: paymentReceiptSchema
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 