const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cho_nong_san_so';

let isConnected = false;

async function connectWithRetry(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!isConnected) {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('MongoDB connected');
      }
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, err.message);
      if (attempt === retries) {
        throw new Error('Failed to connect to MongoDB after multiple attempts');
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = {
  mongoose,
  connectWithRetry,
};
