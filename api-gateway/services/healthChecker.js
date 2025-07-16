const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const serviceRegistry = require('./serviceRegistry');

class HealthChecker {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.healthCheckHistory = new Map();
    this.alertThresholds = {
      consecutiveFailures: 3,
      responseTimeThreshold: 5000, // 5 seconds
      errorRateThreshold: 10 // 10%
    };
  }

  // Bắt đầu health checking
  startHealthChecking() {
    if (this.isRunning) {
      logger.warn('Health checker already running');
      return;
    }

    // Tạo cron job để chạy health check mỗi 30 giây
    const cronExpression = `*/${Math.floor(config.healthCheck.interval / 1000)} * * * * *`;
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.performHealthChecks();
    }, {
      scheduled: false,
      timezone: 'Asia/Ho_Chi_Minh'
    });

    this.cronJob.start();
    this.isRunning = true;
    
    logger.startup(`Health checker started with interval: ${config.healthCheck.interval}ms`);
    
    // Chạy health check ngay lập tức
    this.performHealthChecks();
  }

  // Dừng health checking
  stopHealthChecking() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isRunning = false;
    logger.shutdown('Health checker stopped');
  }

  // Thực hiện health checks cho tất cả services
  async performHealthChecks() {
    try {
      const services = serviceRegistry.getAllServices();
      const healthCheckPromises = [];

      for (const [serviceName, serviceInfo] of Object.entries(services)) {
        healthCheckPromises.push(
          this.checkServiceWithRetry(serviceName, serviceInfo)
        );
      }

      // Chạy tất cả health checks song song
      const results = await Promise.allSettled(healthCheckPromises);
      
      // Xử lý kết quả
      results.forEach((result, index) => {
        const serviceName = Object.keys(services)[index];
        
        if (result.status === 'fulfilled') {
          this.recordHealthCheckResult(serviceName, result.value);
        } else {
          logger.error(`Health check failed for ${serviceName}:`, result.reason);
          this.recordHealthCheckResult(serviceName, {
            status: 'unhealthy',
            error: result.reason.message,
            responseTime: null,
            timestamp: new Date()
          });
        }
      });

      // Phát ra events cho dashboard
      this.emitHealthStatusUpdate();
      
    } catch (error) {
      logger.error('Error during health checks:', error);
    }
  }

  // Kiểm tra health của service với retry
  async checkServiceWithRetry(serviceName, serviceInfo) {
    let lastError = null;
    let attempt = 0;
    
    while (attempt < config.healthCheck.retries) {
      try {
        const result = await serviceRegistry.checkServiceHealth(serviceName);
        
        // Nếu thành công, return kết quả
        if (result.status === 'healthy') {
          return result;
        }
        
        // Nếu không healthy, thử lại
        lastError = new Error(`Service ${serviceName} returned unhealthy status`);
        
      } catch (error) {
        lastError = error;
        logger.warn(`Health check attempt ${attempt + 1} failed for ${serviceName}: ${error.message}`);
      }
      
      attempt++;
      
      // Đợi một chút trước khi retry
      if (attempt < config.healthCheck.retries) {
        await this.delay(1000);
      }
    }
    
    // Nếu tất cả attempts đều fail
    throw lastError;
  }

  // Ghi lại kết quả health check
  recordHealthCheckResult(serviceName, result) {
    if (!this.healthCheckHistory.has(serviceName)) {
      this.healthCheckHistory.set(serviceName, {
        recent: [],
        totalChecks: 0,
        successfulChecks: 0,
        consecutiveFailures: 0,
        lastSuccessful: null,
        lastFailure: null,
        uptimePercentage: 0
      });
    }

    const history = this.healthCheckHistory.get(serviceName);
    
    // Cập nhật history
    history.recent.push({
      timestamp: new Date(),
      status: result.status,
      responseTime: result.responseTime,
      error: result.error
    });
    
    // Giữ chỉ 100 record gần nhất
    if (history.recent.length > 100) {
      history.recent.shift();
    }
    
    history.totalChecks++;
    
    if (result.status === 'healthy') {
      history.successfulChecks++;
      history.consecutiveFailures = 0;
      history.lastSuccessful = new Date();
    } else {
      history.consecutiveFailures++;
      history.lastFailure = new Date();
    }
    
    // Tính uptime percentage
    history.uptimePercentage = (history.successfulChecks / history.totalChecks) * 100;
    
    // Kiểm tra alerts
    this.checkForAlerts(serviceName, history, result);
    
    logger.serviceHealth(serviceName, result.status, result.responseTime);
  }

  // Kiểm tra và gửi alerts
  checkForAlerts(serviceName, history, result) {
    const alerts = [];
    
    // Alert cho consecutive failures
    if (history.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      alerts.push({
        type: 'consecutive_failures',
        serviceName,
        severity: 'high',
        message: `Service ${serviceName} has failed ${history.consecutiveFailures} consecutive health checks`,
        timestamp: new Date()
      });
    }
    
    // Alert cho response time cao
    if (result.responseTime && result.responseTime > this.alertThresholds.responseTimeThreshold) {
      alerts.push({
        type: 'slow_response',
        serviceName,
        severity: 'medium',
        message: `Service ${serviceName} response time is ${result.responseTime}ms (threshold: ${this.alertThresholds.responseTimeThreshold}ms)`,
        timestamp: new Date()
      });
    }
    
    // Alert cho error rate cao
    const errorRate = ((history.totalChecks - history.successfulChecks) / history.totalChecks) * 100;
    if (errorRate > this.alertThresholds.errorRateThreshold) {
      alerts.push({
        type: 'high_error_rate',
        serviceName,
        severity: 'high',
        message: `Service ${serviceName} error rate is ${errorRate.toFixed(2)}% (threshold: ${this.alertThresholds.errorRateThreshold}%)`,
        timestamp: new Date()
      });
    }
    
    // Gửi alerts
    alerts.forEach(alert => {
      this.sendAlert(alert);
    });
  }

  // Gửi alert
  sendAlert(alert) {
    logger.warn(`🚨 ALERT: ${alert.message}`);
    
    // Phát ra event cho dashboard
    this.emitAlert(alert);
    
    // Có thể thêm logic gửi email, SMS, Slack, etc.
  }

  // Phát ra health status update cho dashboard
  emitHealthStatusUpdate() {
    try {
      const io = require('../index').get('io');
      if (io) {
        const systemOverview = serviceRegistry.getSystemOverview();
        const serviceStats = {};
        
        for (const [serviceName] of serviceRegistry.services) {
          serviceStats[serviceName] = serviceRegistry.getServiceStats(serviceName);
        }
        
        io.emit('healthStatusUpdate', {
          systemOverview,
          serviceStats,
          timestamp: new Date()
        });
      }
    } catch (error) {
      // Ignore errors nếu socket.io chưa ready
    }
  }

  // Phát ra alert cho dashboard
  emitAlert(alert) {
    try {
      const io = require('../index').get('io');
      if (io) {
        io.emit('alert', alert);
      }
    } catch (error) {
      // Ignore errors nếu socket.io chưa ready
    }
  }

  // Lấy health history của service
  getHealthHistory(serviceName) {
    return this.healthCheckHistory.get(serviceName) || null;
  }

  // Lấy tất cả health histories
  getAllHealthHistories() {
    const histories = {};
    
    for (const [serviceName, history] of this.healthCheckHistory) {
      histories[serviceName] = history;
    }
    
    return histories;
  }

  // Lấy health summary
  getHealthSummary() {
    const summary = {
      totalServices: this.healthCheckHistory.size,
      healthyServices: 0,
      unhealthyServices: 0,
      services: {},
      systemUptime: 0,
      lastUpdated: new Date()
    };

    for (const [serviceName, history] of this.healthCheckHistory) {
      const isHealthy = history.consecutiveFailures === 0;
      
      if (isHealthy) {
        summary.healthyServices++;
      } else {
        summary.unhealthyServices++;
      }
      
      summary.services[serviceName] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        uptimePercentage: history.uptimePercentage,
        consecutiveFailures: history.consecutiveFailures,
        lastCheck: history.recent[history.recent.length - 1]?.timestamp || null
      };
      
      summary.systemUptime += history.uptimePercentage;
    }
    
    // Tính system uptime trung bình
    if (summary.totalServices > 0) {
      summary.systemUptime = summary.systemUptime / summary.totalServices;
    }
    
    return summary;
  }

  // Utility function để delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Lấy status của health checker
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: config.healthCheck.interval,
      retries: config.healthCheck.retries,
      timeout: config.healthCheck.timeout,
      totalServices: this.healthCheckHistory.size,
      alertThresholds: this.alertThresholds,
      lastCheck: new Date()
    };
  }
}

// Tạo singleton instance
const healthChecker = new HealthChecker();

module.exports = healthChecker; 