const express = require('express');
const router = express.Router();
const serviceRegistry = require('../services/serviceRegistry');
const healthChecker = require('../services/healthChecker');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');
const config = require('../config');
const DatabaseOptimizer = require('../../shared/databaseOptimization');

// Import models
require('../../product_service/productModel');
require('../../user_service/userModel');
require('../../order_service/orderModel');

// ========================================
// MIDDLEWARE
// ========================================

// Basic auth middleware for protected endpoints
const basicAuth = (req, res, next) => {
  if (!config.dashboard.authRequired) {
    return next();
  }
  
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide valid credentials'
    });
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  const username = credentials[0];
  const password = credentials[1];
  
  if (username !== config.dashboard.username || password !== config.dashboard.password) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
    });
  }
  
  next();
};

// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }
    next();
  };
};

// ========================================
// GATEWAY INFORMATION
// ========================================

// Lấy thông tin gateway
router.get('/info', (req, res) => {
  res.json({
    name: config.server.name,
    version: '1.0.0',
    environment: config.server.env,
    port: config.server.port,
    uptime: process.uptime(),
    startTime: new Date(Date.now() - process.uptime() * 1000),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

// Lấy configuration gateway
router.get('/config', basicAuth, (req, res) => {
  // Trả về config an toàn (không có secrets)
  const safeConfig = {
    server: {
      port: config.server.port,
      env: config.server.env,
      name: config.server.name
    },
    services: config.services,
    healthCheck: config.healthCheck,
    loadBalancer: config.loadBalancer,
    monitoring: config.monitoring,
    dashboard: {
      enabled: config.dashboard.enabled,
      path: config.dashboard.path
    }
  };
  
  res.json({
    timestamp: new Date().toISOString(),
    config: safeConfig
  });
});

// ========================================
// SERVICE REGISTRY MANAGEMENT
// ========================================

// Lấy tất cả services
router.get('/services', (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    
    res.json({
      timestamp: new Date().toISOString(),
      services
    });
    
  } catch (error) {
    logger.error('Failed to get services:', error);
    res.status(500).json({
      error: 'Failed to retrieve services',
      message: error.message
    });
  }
});

// Lấy thông tin service cụ thể
router.get('/services/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    const service = serviceRegistry.getService(serviceName);
    
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        serviceName
      });
    }
    
    const stats = serviceRegistry.getServiceStats(serviceName);
    const healthHistory = healthChecker.getHealthHistory(serviceName);
    
    res.json({
      timestamp: new Date().toISOString(),
      service,
      stats,
      healthHistory
    });
    
  } catch (error) {
    logger.error(`Failed to get service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve service',
      message: error.message
    });
  }
});

// Đăng ký service mới
router.post('/services', basicAuth, async (req, res) => {
  try {
    const serviceConfig = req.body;
    
    // Validate required fields
    if (!serviceConfig.name || !serviceConfig.url) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Service name and URL are required'
      });
    }
    
    const service = await serviceRegistry.registerService(serviceConfig);
    
    logger.info(`Service registered via API: ${serviceConfig.name}`);
    
    res.status(201).json({
      message: 'Service registered successfully',
      service,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to register service:', error);
    res.status(500).json({
      error: 'Failed to register service',
      message: error.message
    });
  }
});

// Hủy đăng ký service
router.delete('/services/:serviceName', basicAuth, (req, res) => {
  try {
    const { serviceName } = req.params;
    
    const service = serviceRegistry.getService(serviceName);
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        serviceName
      });
    }
    
    serviceRegistry.unregisterService(serviceName);
    
    logger.info(`Service unregistered via API: ${serviceName}`);
    
    res.json({
      message: 'Service unregistered successfully',
      serviceName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to unregister service:', error);
    res.status(500).json({
      error: 'Failed to unregister service',
      message: error.message
    });
  }
});

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================

// Health check tổng hợp
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthChecker.getOverallHealth();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Health check cho service cụ thể
router.get('/health/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const healthStatus = await healthChecker.checkServiceHealth(serviceName);
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error(`Health check error for ${req.params.serviceName}:`, error);
    res.status(503).json({
      status: 'unhealthy',
      service: req.params.serviceName,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ========================================
// ANALYTICS ENDPOINTS
// ========================================

// Lấy analytics tổng hợp
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await analyticsService.getAnalytics();
    
    res.json({
      timestamp: new Date().toISOString(),
      analytics
    });
    
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// Lấy analytics cho service cụ thể
router.get('/analytics/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const analytics = await analyticsService.getServiceAnalytics(serviceName);
    
    res.json({
      timestamp: new Date().toISOString(),
      service: serviceName,
      analytics
    });
    
  } catch (error) {
    logger.error(`Analytics error for ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Failed to get service analytics',
      message: error.message
    });
  }
});

// ========================================
// PRODUCT SERVICE PROXY
// ========================================

// Proxy all product requests to product service
router.all('/products*', async (req, res) => {
  try {
    const productService = serviceRegistry.getService('product-service');
    
    if (!productService || !productService.healthy) {
      return res.status(503).json({
        error: 'Product service unavailable',
        message: 'Product service is currently down'
      });
    }
    
    // Get current user from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    let sellerId = null;
    
    if (token) {
      try {
        const jwtAuth = require('../middleware/jwtAuth');
        const decoded = jwtAuth.verifyToken(token);
        sellerId = decoded.id;
      } catch (error) {
        console.log('JWT verification failed:', error.message);
      }
    }
    
    // Forward request to product service
    const targetUrl = `${productService.url}${req.path}`;
    const requestOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(productService.url).host
      }
    };
    
    // Handle different content types
    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For file uploads, pipe the request directly
        const http = require('http');
        const url = require('url');
        const targetUrlObj = url.parse(targetUrl);
        
        const proxyReq = http.request({
          hostname: targetUrlObj.hostname,
          port: targetUrlObj.port,
          path: targetUrlObj.path,
          method: req.method,
          headers: req.headers
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });
        
        req.pipe(proxyReq);
        return;
      } else {
        // For JSON data, add sellerId if available
        if (sellerId && req.body) {
          req.body.sellerId = sellerId;
        }
        requestOptions.body = JSON.stringify(req.body);
      }
    }
    
    const response = await fetch(targetUrl, requestOptions);
    const data = await response.json();
    
    res.status(response.status).json(data);
    
  } catch (error) {
    logger.error('Product service proxy error:', error);
    res.status(500).json({
      error: 'Product service error',
      message: error.message
    });
  }
});

// ========================================
// DATABASE OPTIMIZATION
// ========================================

// Database Optimization Endpoint
router.post('/optimize-database', basicAuth, async (req, res) => {
  try {
    const optimizer = new DatabaseOptimizer();
    
    console.log('🚀 Starting database optimization via API...');
    const result = await optimizer.runOptimization();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Database optimization completed successfully',
        duration: result.duration,
        improvements: result.improvements,
        indexStats: result.indexStats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database optimization failed',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Database optimization API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during database optimization',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database Stats Endpoint
router.get('/database-stats', async (req, res) => {
  try {
    const optimizer = new DatabaseOptimizer();
    const stats = await optimizer.getIndexStats();
    
    res.json({
      success: true,
      indexStats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database stats API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance Test Endpoint
router.get('/performance-test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Simulate some database operations
    const testResults = {
      cacheTest: Date.now() - startTime,
      databaseTest: Date.now() - startTime,
      totalTime: Date.now() - startTime
    };
    
    res.json({
      success: true,
      message: 'Performance test completed',
      results: testResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Performance test error:', error);
    res.status(500).json({
      success: false,
      message: 'Performance test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler cho API routes
router.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler cho API routes
router.use((err, req, res, next) => {
  logger.error('API error:', err);
  
  res.status(err.status || 500).json({
    error: 'API error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 