const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('./productModel');
const controller = require('./productController');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cho-nong-san-so';

// Tự động tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage config + filter + size limit
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ cho phép upload file ảnh (jpg, jpeg, png, gif)!'), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Serve static files from uploads
app.use('/uploads', express.static(uploadDir));

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
      service: 'product-service',
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
      service: 'product-service',
      error: error.message
    });
  }
});

// Không cần định nghĩa lại Product model ở đây
// Nếu cần dùng Product, chỉ cần:
// const Product = require('./productModel');

// API upload sản phẩm với nhiều ảnh
app.post('/api/products', function(req, res, next) {
  upload.array('images', 5)(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Lỗi upload file', error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Chuẩn bị data với imageUrls từ uploaded files
    const productData = {
      name: req.body.name,
      price: parseFloat(req.body.price),
      category: req.body.category,
      description: req.body.description,
      unit: req.body.unit
    };
    
    // Thêm imageUrls nếu có files upload
    if (req.files && req.files.length > 0) {
      productData.imageUrls = req.files.map(f => '/uploads/' + f.filename);
    }
    
    // Sử dụng controller để đảm bảo thống nhất với service layer
    req.body = productData;
    return controller.create(req, res);
    
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo sản phẩm', error: err.message });
  }
});

// API lấy ảnh từ GridFS
app.get('/api/images/:id', async (req, res) => {
  try {
    if (!gfs) return res.status(500).json({ error: 'GridFS not ready' });
    const file = await gfs.files.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: 'File not found' });
    const readstream = gfs.createReadStream(file.filename);
    res.set('Content-Type', file.contentType);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching image' });
  }
});

// API routes sử dụng controller để đảm bảo thống nhất
app.get('/api/products', (req, res) => controller.getAll(req, res));
app.get('/api/products/:id', (req, res) => controller.getById(req, res));
app.put('/api/products/:id', (req, res) => controller.update(req, res));
app.delete('/api/products/:id', (req, res) => controller.delete(req, res));
app.get('/api/products/:id/trace', (req, res) => controller.getTrace(req, res));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Thêm middleware bắt lỗi toàn cục ở cuối file
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Lỗi upload file', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Product Service running on port', PORT);
});
