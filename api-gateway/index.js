const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Added for manual sync

// Import configurations and utilities
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB } = require('./utils/database');
const healthChecker = require('./services/healthChecker');
const serviceRegistry = require('./services/serviceRegistry');
const analyticsService = require('./services/analyticsService');
const mockDB = require('./utils/mockDatabase');
const RealDatabase = require('./utils/realDatabase');

// Initialize real database globally
const realDB = new RealDatabase();

// Import cache middleware
const cacheMiddleware = require('./middleware/cacheMiddleware');
const cacheConfig = require('./config/cache');

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const sellerRoutes = require('./routes/seller');

// Import JWT auth middleware
const jwtAuth = require('./middleware/jwtAuth');

// Create verifyToken middleware wrapper
const verifyToken = jwtAuth.authenticateToken.bind(jwtAuth);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: config.socketIO.corsOrigin,
    methods: ['GET', 'POST']
  },
  pingTimeout: config.socketIO.pingTimeout,
  pingInterval: config.socketIO.pingInterval
});

// Make io accessible to routes
app.set('io', io);

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet for security headers (disable CSP completely for testing)
app.use(helmet({
  contentSecurityPolicy: false
}));

// TEMPORARY: No CSP restrictions for testing
// TODO: Re-enable CSP after confirming functionality works

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Slow down middleware
const speedLimiter = slowDown({
  windowMs: config.rateLimit.windowMs,
  delayAfter: config.rateLimit.slowDownDelayAfter,
  delayMs: () => config.rateLimit.slowDownDelayMs, // Fix deprecated option
  validate: {delayMs: false} // Disable warning
});

app.use('/api', speedLimiter);

// ========================================
// LOGGING MIDDLEWARE
// ========================================

// HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Custom analytics middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    analyticsService.recordRequest({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date()
    });
  });
  
  next();
});

// ========================================
// BODY PARSING MIDDLEWARE
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// STATIC FILES (with client-side redirect)
// ========================================

// Serve dashboard static files
app.use('/dashboard', express.static(path.join(__dirname, 'public')));

// Handle root URL FIRST - serve index.html for smart redirect
app.get('/', (req, res) => {
  // Prevent caching for index page
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Serve frontend static files with cache control (NO INDEX SERVING)
app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false, // Disable automatic index.html serving - we handle root URL manually
  setHeaders: (res, path) => {
    // Prevent caching for HTML files
    if (path.endsWith('.html')) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    // Allow caching for other assets (CSS, JS, images)
    else {
      res.set({
        'Cache-Control': 'public, max-age=86400' // 1 day cache for assets
      });
    }
  }
}));

// Authentication middleware for protected routes
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  
  if (!token) {
    // No token in header or query, redirect to login
    return res.redirect('/login');
  }

  try {
    const decoded = jwtAuth.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, redirect to login
    return res.redirect('/login');
  }
};

// Handle SPA routing - serve corresponding HTML files
app.get('/home', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'home.html'));
});

app.get('/cart', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'cart.html'));
});

app.get('/order', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'order.html'));
});

app.get('/user', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'user.html'));
});

app.get('/product', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'product.html'));
});

// Authentication and panel pages
app.get(['/login', '/login.html'], (req, res) => {
  // Prevent caching for login page
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

app.get(['/debug', '/debug-auth', '/debug-auth.html'], (req, res) => {
  // Prevent caching for debug page
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'debug-auth.html'));
});

// Admin-only monitoring routes - require authentication
app.get(['/admin/monitoring', '/admin/monitoring-dashboard'], verifyToken, (req, res) => {
  // Check if user is admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  
  // Prevent caching for monitoring dashboard
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'monitoring-dashboard.html'));
});

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.set({
    'Content-Type': 'image/x-icon',
    'Cache-Control': 'public, max-age=86400' // Cache for 1 day
  });
  // Return empty favicon (204 No Content) to prevent errors
  res.status(204).end();
});

app.get(['/admin', '/admin-panel', '/admin-panel.html'], (req, res) => {
  // Prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'admin-panel.html'));
});

app.get(['/logistics', '/logistics-panel', '/logistics-panel.html'], (req, res) => {
  // Prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../frontend', 'logistics-panel.html'));
});

// Serve specific HTML pages with query parameters
app.get('/add-product.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'add-product.html'));
});

app.get('/add-product', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'add-product.html'));
});

app.get('/success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'success.html'));
});

// Category pages
app.get('/category-*.html', (req, res) => {
  const filename = path.basename(req.path);
  res.sendFile(path.join(__dirname, '../frontend', filename));
});

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================

app.use('/health', healthRoutes);

// ========================================
// DASHBOARD ROUTES
// ========================================

if (config.dashboard.enabled) {
  app.use('/dashboard', dashboardRoutes);
}

// ========================================
// API PROXY ROUTES
// ========================================

// Mock endpoints for admin panel when microservices are down
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        _id: 'user1',
        username: 'demo_user',
        email: 'user@demo.com',
        role: 'user',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user2', 
        username: 'demo_admin',
        email: 'admin@demo.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user3',
        username: 'demo_logistics',
        email: 'logistics@demo.com', 
        role: 'logistics',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/products', async (req, res) => {
  try {
    // Try to sync from microservice first
    await realDB.syncProductsFromMicroservice();
    
    const products = realDB.getAllProducts();
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = realDB.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = realDB.updateProduct(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Also try to update in microservice
    try {
      await axios.put(`http://localhost:3001/api/products/${req.params.id}`, req.body);
    } catch (error) {
      console.warn('Failed to update product in microservice:', error);
    }
    
    res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = realDB.deleteProduct(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Also try to delete in microservice
    try {
      await axios.delete(`http://localhost:3001/api/products/${req.params.id}`);
    } catch (error) {
      console.warn('Failed to delete product in microservice:', error);
    }
    
    res.json({
      success: true,
      product: deletedProduct
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    // Try to sync from microservice first
    await realDB.syncOrdersFromMicroservice();
    
    const orders = realDB.getAllOrders();
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = realDB.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = realDB.updateOrder(req.params.id, req.body);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Also try to update in microservice
    try {
      await axios.put(`http://localhost:3004/api/orders/${req.params.id}`, req.body);
    } catch (error) {
      console.warn('Failed to update order in microservice:', error);
    }
    
    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order'
    });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deletedOrder = realDB.deleteOrder(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Also try to delete in microservice
    try {
      await axios.delete(`http://localhost:3004/api/orders/${req.params.id}`);
    } catch (error) {
      console.warn('Failed to delete order in microservice:', error);
    }
    
    res.json({
      success: true,
      order: deletedOrder
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    // Try to sync from microservice first
    await realDB.syncUsersFromMicroservice();
    
    const users = realDB.getAllUsers();
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    console.log('🔄 Manual sync requested from admin panel');
    
    const [products, orders, users] = await Promise.all([
      realDB.syncProductsFromMicroservice(),
      realDB.syncOrdersFromMicroservice(),
      realDB.syncUsersFromMicroservice()
    ]);
    
    res.json({
      success: true,
      message: 'Data synchronized successfully',
      stats: {
        products: products.length,
        orders: orders.length,
        users: users.length
      }
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Error during synchronization'
    });
  }
});

// Webhook endpoint to sync data when products/orders are added
app.post('/api/webhook/sync', async (req, res) => {
  try {
    const { type, data } = req.body; // type: 'product' | 'order', data: the new item
    
    console.log(`🔄 Webhook sync requested for ${type}:`, data);
    
    if (type === 'product' && data) {
      // Add the new product to our database
      realDB.createProduct(data);
      console.log('✅ Product synced to admin database');
    } else if (type === 'order' && data) {
      // Add the new order to our database
      realDB.createOrder(data);
      console.log('✅ Order synced to admin database');
    }
    
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('❌ Error in webhook sync:', error);
    res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

// Auto-sync endpoint that can be called by frontend
app.post('/api/auto-sync', async (req, res) => {
  try {
    console.log('🔄 Auto-sync triggered from frontend');
    
    const [products, orders] = await Promise.all([
      realDB.syncProductsFromMicroservice(),
      realDB.syncOrdersFromMicroservice()
    ]);
    
    res.json({
      success: true,
      message: 'Auto-sync completed',
      stats: {
        products: products.length,
        orders: orders.length
      }
    });
  } catch (error) {
    console.error('❌ Error in auto-sync:', error);
    res.status(500).json({ success: false, message: 'Auto-sync failed' });
  }
});

// Product Service Proxy (with caching)
app.use('/api/products/proxy', 
  cacheMiddleware.cache(cacheConfig.ttl.products), // Cache products theo config
  createProxyMiddleware({
  target: config.services.product.url,
  changeOrigin: config.proxy.changeOrigin,
  timeout: config.proxy.timeout,
  pathRewrite: {
    '^/api/products/proxy': ''
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error for product service: ${err.message}`);
    res.status(503).json({
      error: 'Service temporarily unavailable',
      service: 'product-service',
      timestamp: new Date().toISOString()
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Product service response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
  })
);

// Order Service Proxy
app.use('/api/orders/proxy', createProxyMiddleware({
  target: config.services.order.url,
  changeOrigin: config.proxy.changeOrigin,
  timeout: config.proxy.timeout,
  pathRewrite: {
    '^/api/orders/proxy': ''
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error for order service: ${err.message}`);
    res.status(503).json({
      error: 'Service temporarily unavailable',
      service: 'order-service',
      timestamp: new Date().toISOString()
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Order service response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
}));

// User Service Proxy (with selective caching)
app.use('/api/users/proxy', 
  cacheMiddleware.cache(cacheConfig.ttl.users), // Cache users theo config
  createProxyMiddleware({
  target: config.services.user.url,
  changeOrigin: config.proxy.changeOrigin,
  timeout: config.proxy.timeout,
  pathRewrite: {
    '^/api/users/proxy': ''
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error for user service: ${err.message}`);
    res.status(503).json({
      error: 'Service temporarily unavailable',
      service: 'user-service',
      timestamp: new Date().toISOString()
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`User service response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
  })
);

// ========================================
// API ROUTES FOR ADMIN PANEL
// ========================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Analytics routes
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// Gateway API routes
app.use('/api/gateway', apiRoutes);

// Seller routes (with authentication)
app.use('/api/seller', verifyToken, sellerRoutes);

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    // Try to sync from microservice first (with fallback)
    try {
      await realDB.syncUsersFromMicroservice();
    } catch (syncError) {
      console.warn('Failed to sync users from microservice:', syncError.message);
    }
    
    const users = realDB.getAllUsers();
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = realDB.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    // Try to sync from microservice first (with fallback)
    try {
      await realDB.syncProductsFromMicroservice();
    } catch (syncError) {
      console.warn('Failed to sync products from microservice:', syncError.message);
    }
    
    const products = realDB.getAllProducts();
    console.log(`📦 Retrieved ${products.length} products for admin panel`);
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = realDB.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    console.log(`📦 Retrieved product: ${product.name}`);
    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    console.log(`📝 Updating product ${req.params.id}:`, req.body);
    
    const updatedProduct = realDB.updateProduct(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Also try to update in microservice (best effort)
    try {
      const microserviceResponse = await axios.put(`http://localhost:3001/api/products/${req.params.id}`, req.body);
      if (microserviceResponse.status === 200) {
        console.log('✅ Product also updated in microservice');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update product in microservice:', error.message);
    }
    
    console.log(`✅ Product updated successfully: ${updatedProduct.name}`);
    res.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product: ' + error.message
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting product ${req.params.id}`);
    
    const deletedProduct = realDB.deleteProduct(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Also try to delete in microservice (best effort)
    try {
      const microserviceResponse = await axios.delete(`http://localhost:3001/api/products/${req.params.id}`);
      if (microserviceResponse.status === 200) {
        console.log('✅ Product also deleted from microservice');
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete product from microservice:', error.message);
    }
    
    console.log(`✅ Product deleted successfully: ${deletedProduct.name}`);
    res.json({
      success: true,
      product: deletedProduct,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product: ' + error.message
    });
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    // Try to sync from microservice first (with fallback)
    try {
      await realDB.syncOrdersFromMicroservice();
    } catch (syncError) {
      console.warn('Failed to sync orders from microservice:', syncError.message);
    }
    
    const orders = realDB.getAllOrders();
    console.log(`📋 Retrieved ${orders.length} orders for admin panel`);
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = realDB.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    console.log(`📋 Retrieved order: ${order._id}`);
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    console.log(`📝 Updating order ${req.params.id}:`, req.body);
    
    const updatedOrder = realDB.updateOrder(req.params.id, req.body);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Also try to update in microservice (best effort)
    try {
      const microserviceResponse = await axios.put(`http://localhost:3004/api/orders/${req.params.id}`, req.body);
      if (microserviceResponse.status === 200) {
        console.log('✅ Order also updated in microservice');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update order in microservice:', error.message);
    }
    
    console.log(`✅ Order updated successfully: ${updatedOrder._id}`);
    res.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order: ' + error.message
    });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting order ${req.params.id}`);
    
    const deletedOrder = realDB.deleteOrder(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Also try to delete in microservice (best effort)
    try {
      const microserviceResponse = await axios.delete(`http://localhost:3004/api/orders/${req.params.id}`);
      if (microserviceResponse.status === 200) {
        console.log('✅ Order also deleted from microservice');
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete order from microservice:', error.message);
    }
    
    console.log(`✅ Order deleted successfully: ${deletedOrder._id}`);
    res.json({
      success: true,
      order: deletedOrder,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order: ' + error.message
    });
  }
});

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    console.log('🔄 Manual sync requested from admin panel');
    
    const results = {
      products: [],
      orders: [],
      users: []
    };
    
    // Sync with error handling for each service
    try {
      results.products = await realDB.syncProductsFromMicroservice();
    } catch (error) {
      console.warn('Failed to sync products:', error.message);
    }
    
    try {
      results.orders = await realDB.syncOrdersFromMicroservice();
    } catch (error) {
      console.warn('Failed to sync orders:', error.message);
    }
    
    try {
      results.users = await realDB.syncUsersFromMicroservice();
    } catch (error) {
      console.warn('Failed to sync users:', error.message);
    }
    
    console.log(`✅ Sync completed: ${results.products.length} products, ${results.orders.length} orders, ${results.users.length} users`);
    
    res.json({
      success: true,
      message: 'Data synchronized successfully',
      stats: {
        products: results.products.length,
        orders: results.orders.length,
        users: results.users.length
      }
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Error during synchronization: ' + error.message
    });
  }
});

// Test endpoint to verify database functionality
app.get('/api/test-database', async (req, res) => {
  try {
    console.log('🧪 Testing database functionality...');
    
    // Test creating a sample product
    const testProduct = realDB.createProduct({
      name: 'Test Product ' + Date.now(),
      price: 10000,
      category: 'Test',
      description: 'This is a test product',
      unit: 'kg'
    });
    
    // Test reading all products
    const allProducts = realDB.getAllProducts();
    
    // Test updating the product
    const updatedProduct = realDB.updateProduct(testProduct._id, {
      name: 'Updated Test Product'
    });
    
    // Test deleting the product
    const deletedProduct = realDB.deleteProduct(testProduct._id);
    
    res.json({
      success: true,
      message: 'Database functionality test completed',
      results: {
        created: !!testProduct,
        totalProducts: allProducts.length,
        updated: !!updatedProduct,
        deleted: !!deletedProduct
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed: ' + error.message
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.server.env === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SOCKET.IO EVENTS
// ========================================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Send current service status to new client
  socket.emit('serviceStatus', serviceRegistry.getAllServices());
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
  
  socket.on('getServiceStatus', () => {
    socket.emit('serviceStatus', serviceRegistry.getAllServices());
  });
});

// ========================================
// STARTUP SEQUENCE
// ========================================

async function startServer() {
  try {
    // Connect to database (with error handling)
    try {
    await connectDB();
    logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.warn(`⚠️ Database connection failed: ${error.message}`);
      logger.info('📝 Continuing without database - some features may be limited');
    }
    
    // Initialize service registry
    await serviceRegistry.initialize();
    logger.info('✅ Service registry initialized');
    
    // Start health checking
    healthChecker.startHealthChecking();
    logger.info('✅ Health checking started');
    
    // Start analytics service
    analyticsService.start();
    logger.info('✅ Analytics service started');
    
    // Start auto sync from microservices
    realDB.startAutoSync(2); // Sync every 2 minutes
    
    // Start server
    server.listen(config.server.port, () => {
      logger.info(`🚀 API Gateway is running on port ${config.server.port}`);
      logger.info(`📊 Dashboard: http://localhost:${config.server.port}/dashboard`);
      logger.info(`🔗 API Endpoints: http://localhost:${config.server.port}/api`);
      logger.info(`❤️  Health Check: http://localhost:${config.server.port}/health`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('✅ HTTP server closed');
    
    // Stop health checking
    healthChecker.stopHealthChecking();
    
    // Stop analytics service
    analyticsService.stop();
    
    // Disconnect Redis cache
    cacheMiddleware.disconnect();
    logger.info('✅ Redis cache disconnected');
    
    // Close database connection
    require('mongoose').connection.close(() => {
      logger.info('✅ Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app; 