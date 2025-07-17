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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cho-nong-san-so');

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Kiểm tra kết nối database
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    const healthStatus = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      version: '1.0.0',
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: 'cho-nong-san-so'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      error: error.message
    });
  }
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
