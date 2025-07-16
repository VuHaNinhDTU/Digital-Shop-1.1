const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const controller = require('./userController');
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

app.post('/api/users/register', (req, res) => controller.register(req, res));
app.post('/api/users/login', (req, res) => controller.login(req, res));
app.get('/api/users', (req, res) => controller.getAll(req, res));
app.get('/api/users/:id', (req, res) => controller.getById(req, res));
app.put('/api/users/:id', (req, res) => controller.update(req, res));
app.delete('/api/users/:id', (req, res) => controller.delete(req, res));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
