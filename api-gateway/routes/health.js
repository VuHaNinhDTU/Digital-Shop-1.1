const express = require('express');
const router = express.Router();
const healthChecker = require('../services/healthChecker');
const serviceRegistry = require('../services/serviceRegistry');
const analyticsService = require('../services/analyticsService');
const { getDBStats, checkDBHealth } = require('../utils/database');
const cacheMiddleware = require('../middleware/cacheMiddleware');
const logger = require('../utils/logger');

// ========================================
// BASIC HEALTH CHECK
// ========================================

// Health check endpoint chính
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Lấy tổng quan hệ thống
    const systemOverview = serviceRegistry.getSystemOverview();
    const healthSummary = healthChecker.getHealthSummary();
    const dbHealth = await checkDBHealth();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      version: '1.0.0',
      system: {
        gateway: 'healthy',
        database: dbHealth.status,
        services: {
          total: systemOverview.totalServices,
          healthy: systemOverview.healthyServices,
          unhealthy: systemOverview.unhealthyServices
        }
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: {
        usage: process.cpuUsage()
      }
    };
    
    // Xác định status tổng thể
    if (dbHealth.status === 'unhealthy' || systemOverview.unhealthyServices > 0) {
      healthStatus.status = 'degraded';
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    logger.info(`Health check completed in ${responseTime}ms - Status: ${healthStatus.status}`);
    
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// ========================================
// DETAILED HEALTH CHECKS
// ========================================

// Detailed health check với tất cả thông tin
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const [
      systemOverview,
      healthSummary,
      dbHealth,
      dbStats,
      analyticsStatus,
      cacheHealth
    ] = await Promise.all([
      serviceRegistry.getSystemOverview(),
      healthChecker.getHealthSummary(),
      checkDBHealth(),
      getDBStats(),
      analyticsService.getStatus(),
      cacheMiddleware.healthCheck()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      gateway: {
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      database: {
        ...dbHealth,
        stats: dbStats
      },
      cache: {
        redis: cacheHealth
      },
      services: {
        overview: systemOverview,
        summary: healthSummary,
        details: serviceRegistry.getAllServices()
      },
      analytics: analyticsStatus,
      healthChecker: healthChecker.getStatus()
    };
    
    // Xác định status tổng thể
    if (dbHealth.status === 'unhealthy') {
      detailedHealth.status = 'critical';
    } else if (systemOverview.unhealthyServices > 0 || cacheHealth.status === 'error') {
      detailedHealth.status = 'degraded';
    } else if (cacheHealth.status === 'disconnected') {
      detailedHealth.status = 'warning';
    }
    
    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(detailedHealth);
    
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: error.message,
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  }
});

// ========================================
// SERVICE-SPECIFIC HEALTH CHECKS
// ========================================

// Lấy health status của tất cả services
router.get('/services', async (req, res) => {
  try {
    const services = serviceRegistry.getAllServices();
    const serviceHealths = {};
    
    for (const [serviceName, serviceInfo] of Object.entries(services)) {
      serviceHealths[serviceName] = {
        status: serviceInfo.status,
        instances: serviceInfo.instances.length,
        healthyInstances: serviceInfo.instances.filter(i => i.status === 'healthy').length,
        lastHealthCheck: serviceInfo.lastHealthCheck,
        responseTime: serviceInfo.responseTime,
        requestCount: serviceInfo.requestCount,
        errorCount: serviceInfo.errorCount,
        errorRate: serviceInfo.requestCount > 0 ? 
          (serviceInfo.errorCount / serviceInfo.requestCount) * 100 : 0
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      services: serviceHealths
    });
    
  } catch (error) {
    logger.error('Services health check failed:', error);
    res.status(500).json({
      error: 'Failed to get services health',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check cho service cụ thể
router.get('/services/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const service = serviceRegistry.getService(serviceName);
    
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        serviceName,
        timestamp: new Date().toISOString()
      });
    }
    
    // Trigger health check cho service này
    const healthResult = await serviceRegistry.checkServiceHealth(serviceName);
    const healthHistory = healthChecker.getHealthHistory(serviceName);
    const serviceStats = serviceRegistry.getServiceStats(serviceName);
    
    res.json({
      serviceName,
      timestamp: new Date().toISOString(),
      health: healthResult,
      history: healthHistory,
      stats: serviceStats,
      instances: service.instances.map(instance => ({
        id: instance.id,
        url: instance.url,
        status: instance.status,
        responseTime: instance.responseTime,
        connections: instance.connections,
        lastUsed: instance.lastUsed
      }))
    });
    
  } catch (error) {
    logger.error(`Health check failed for service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Health check failed',
      serviceName: req.params.serviceName,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// DEPENDENCY HEALTH CHECKS
// ========================================

// Kiểm tra health của dependencies
router.get('/dependencies', async (req, res) => {
  try {
    const dependencies = {
      database: await checkDBHealth(),
      services: {},
      external: {}
    };
    
    // Kiểm tra services
    const services = serviceRegistry.getAllServices();
    for (const [serviceName, serviceInfo] of Object.entries(services)) {
      dependencies.services[serviceName] = {
        status: serviceInfo.status,
        responseTime: serviceInfo.responseTime,
        lastCheck: serviceInfo.lastHealthCheck
      };
    }
    
    // Kiểm tra external dependencies (có thể mở rộng)
    dependencies.external = {
      // Có thể thêm external APIs, third-party services, etc.
    };
    
    // Xác định status tổng thể
    let overallStatus = 'healthy';
    
    if (dependencies.database.status === 'unhealthy') {
      overallStatus = 'critical';
    } else if (Object.values(dependencies.services).some(s => s.status === 'unhealthy')) {
      overallStatus = 'degraded';
    }
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies
    });
    
  } catch (error) {
    logger.error('Dependencies health check failed:', error);
    res.status(500).json({
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// LIVENESS & READINESS PROBES
// ========================================

// Liveness probe - kiểm tra gateway còn sống không
router.get('/liveness', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// Readiness probe - kiểm tra gateway sẵn sàng nhận traffic
router.get('/readiness', async (req, res) => {
  try {
    const dbHealth = await checkDBHealth();
    const systemOverview = serviceRegistry.getSystemOverview();
    
    const isReady = dbHealth.status === 'healthy' && 
                   systemOverview.healthyServices > 0;
    
    const statusCode = isReady ? 200 : 503;
    
    res.status(statusCode).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      database: dbHealth.status,
      services: {
        healthy: systemOverview.healthyServices,
        total: systemOverview.totalServices
      }
    });
    
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// METRICS & MONITORING
// ========================================

// Lấy metrics summary
router.get('/metrics', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const dashboardStats = await analyticsService.getDashboardStats(timeRange);
    
    res.json({
      timestamp: new Date().toISOString(),
      timeRange,
      ...dashboardStats
    });
    
  } catch (error) {
    logger.error('Metrics retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Lấy real-time metrics
router.get('/metrics/realtime', (req, res) => {
  try {
    const realTimeMetrics = analyticsService.getRealTimeMetrics();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...realTimeMetrics
    });
    
  } catch (error) {
    logger.error('Real-time metrics retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve real-time metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// HEALTH HISTORY & ALERTS
// ========================================

// Lấy health history
router.get('/history', (req, res) => {
  try {
    const serviceName = req.query.service;
    
    if (serviceName) {
      const history = healthChecker.getHealthHistory(serviceName);
      if (!history) {
        return res.status(404).json({
          error: 'Service not found',
          serviceName,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        serviceName,
        timestamp: new Date().toISOString(),
        history
      });
    } else {
      const allHistories = healthChecker.getAllHealthHistories();
      res.json({
        timestamp: new Date().toISOString(),
        histories: allHistories
      });
    }
    
  } catch (error) {
    logger.error('Health history retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve health history',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint để ping services manually
router.post('/ping/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const healthResult = await serviceRegistry.checkServiceHealth(serviceName);
    
    res.json({
      serviceName,
      timestamp: new Date().toISOString(),
      result: healthResult
    });
    
  } catch (error) {
    logger.error(`Manual ping failed for service ${req.params.serviceName}:`, error);
    res.status(500).json({
      error: 'Ping failed',
      serviceName: req.params.serviceName,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 