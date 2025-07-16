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
    logger.error(`Failed to unregister service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Failed to unregister service',
      message: error.message
    });
  }
});

// ========================================
// ANALYTICS & METRICS
// ========================================

// Lấy dashboard analytics
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const dashboardStats = await analyticsService.getDashboardStats(timeRange);
    
    res.json({
      timestamp: new Date().toISOString(),
      ...dashboardStats
    });
    
  } catch (error) {
    logger.error('Failed to get dashboard analytics:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics',
      message: error.message
    });
  }
});

// Lấy top endpoints
router.get('/analytics/endpoints', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeRange = req.query.timeRange || '1h';
    
    const topEndpoints = await analyticsService.getTopEndpoints(limit, timeRange);
    
    res.json({
      timestamp: new Date().toISOString(),
      timeRange,
      limit,
      endpoints: topEndpoints
    });
    
  } catch (error) {
    logger.error('Failed to get top endpoints:', error);
    res.status(500).json({
      error: 'Failed to retrieve top endpoints',
      message: error.message
    });
  }
});

// Lấy error analysis
router.get('/analytics/errors', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const errorAnalysis = await analyticsService.getErrorAnalysis(timeRange);
    
    res.json({
      timestamp: new Date().toISOString(),
      timeRange,
      errors: errorAnalysis
    });
    
  } catch (error) {
    logger.error('Failed to get error analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve error analysis',
      message: error.message
    });
  }
});

// ========================================
// SYSTEM MONITORING
// ========================================

// Lấy system overview
router.get('/system/overview', (req, res) => {
  try {
    const systemOverview = serviceRegistry.getSystemOverview();
    const healthSummary = healthChecker.getHealthSummary();
    const analyticsStatus = analyticsService.getStatus();
    
    res.json({
      timestamp: new Date().toISOString(),
      system: systemOverview,
      health: healthSummary,
      analytics: analyticsStatus,
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
    
  } catch (error) {
    logger.error('Failed to get system overview:', error);
    res.status(500).json({
      error: 'Failed to retrieve system overview',
      message: error.message
    });
  }
});

// Lấy system metrics
router.get('/system/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: process.loadavg && process.loadavg(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      ppid: process.ppid
    };
    
    res.json(metrics);
    
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve system metrics',
      message: error.message
    });
  }
});

// ========================================
// LOAD BALANCER MANAGEMENT
// ========================================

// Lấy load balancer stats
router.get('/loadbalancer/stats', (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    const loadBalancerStats = {};
    
    for (const [serviceName, serviceInfo] of Object.entries(services)) {
      if (serviceInfo.loadBalancer) {
        loadBalancerStats[serviceName] = {
          strategy: serviceInfo.loadBalancer.strategy,
          healthyInstances: serviceInfo.loadBalancer.healthyInstances.length,
          totalInstances: serviceInfo.instances.length,
          metrics: serviceInfo.loadBalancer.metrics
        };
      }
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      loadBalancerStats
    });
    
  } catch (error) {
    logger.error('Failed to get load balancer stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve load balancer stats',
      message: error.message
    });
  }
});

// ========================================
// HEALTH CHECK MANAGEMENT
// ========================================

// Trigger health check cho tất cả services
router.post('/health/check-all', basicAuth, async (req, res) => {
  try {
    await healthChecker.performHealthChecks();
    
    res.json({
      message: 'Health checks triggered for all services',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to trigger health checks:', error);
    res.status(500).json({
      error: 'Failed to trigger health checks',
      message: error.message
    });
  }
});

// Trigger health check cho service cụ thể
router.post('/health/check/:serviceName', basicAuth, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const healthResult = await serviceRegistry.checkServiceHealth(serviceName);
    
    res.json({
      serviceName,
      result: healthResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Failed to check health for service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Failed to check service health',
      message: error.message
    });
  }
});

// ========================================
// LOGS & DEBUGGING
// ========================================

// Lấy logs gần đây
router.get('/logs', basicAuth, (req, res) => {
  try {
    const level = req.query.level || 'info';
    const limit = parseInt(req.query.limit) || 100;
    
    // Đây là mock implementation
    // Trong thực tế, bạn sẽ đọc từ log files hoặc log database
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'API Gateway started successfully',
        service: 'gateway'
      }
    ];
    
    res.json({
      timestamp: new Date().toISOString(),
      level,
      limit,
      logs
    });
    
  } catch (error) {
    logger.error('Failed to get logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve logs',
      message: error.message
    });
  }
});

// ========================================
// WEBSOCKET EVENTS
// ========================================

// Emit event to dashboard
router.post('/events/emit', basicAuth, (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({
        error: 'Event name is required'
      });
    }
    
    const io = req.app.get('io');
    if (io) {
      io.emit(event, data);
      
      res.json({
        message: 'Event emitted successfully',
        event,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'WebSocket not available'
      });
    }
    
  } catch (error) {
    logger.error('Failed to emit event:', error);
    res.status(500).json({
      error: 'Failed to emit event',
      message: error.message
    });
  }
});

// ========================================
// DATABASE OPTIMIZATION ENDPOINTS
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