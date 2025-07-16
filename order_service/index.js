const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const controller = require('./orderController');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cho-nong-san-so', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post('/api/orders', (req, res) => controller.create(req, res));
app.get('/api/orders', (req, res) => controller.getAll(req, res));
app.get('/api/orders/:id', (req, res) => controller.getById(req, res));
app.put('/api/orders/:id', (req, res) => controller.update(req, res));
app.delete('/api/orders/:id', (req, res) => controller.delete(req, res));
app.get('/api/orders/:id/trace', (req, res) => controller.getTrace(req, res));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
