const config = require('../config');
const logger = require('../utils/logger');
const { mongoose } = require('../utils/database');

// Schema cho request analytics
const requestAnalyticsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  method: { type: String, required: true },
  url: { type: String, required: true },
  statusCode: { type: Number, required: true },
  duration: { type: Number, required: true },
  userAgent: String,
  ip: String,
  service: String,
  userId: String,
  error: String,
  responseSize: Number,
  requestSize: Number
}, {
  timestamps: true,
  collection: 'request_analytics'
});

// Schema cho service metrics
const serviceMetricsSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  requestCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  totalResponseTime: { type: Number, default: 0 },
  p95ResponseTime: { type: Number, default: 0 },
  p99ResponseTime: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  connections: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'service_metrics'
});

// Tạo indexes
requestAnalyticsSchema.index({ timestamp: 1 });
requestAnalyticsSchema.index({ service: 1, timestamp: 1 });
requestAnalyticsSchema.index({ statusCode: 1 });
requestAnalyticsSchema.index({ ip: 1 });

serviceMetricsSchema.index({ serviceName: 1, timestamp: 1 });
serviceMetricsSchema.index({ timestamp: 1 });

const RequestAnalytics = mongoose.model('RequestAnalytics', requestAnalyticsSchema);
const ServiceMetrics = mongoose.model('ServiceMetrics', serviceMetricsSchema);

class AnalyticsService {
  constructor() {
    this.isRunning = false;
    this.metricsInterval = null;
    this.requestBuffer = [];
    this.metricsBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000; // 5 seconds
    this.flushTimer = null;
    this.cache = new Map();
    this.realTimeMetrics = {
      requestsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      activeConnections: 0,
      topEndpoints: [],
      topErrors: []
    };
  }

  // Bắt đầu analytics service
  start() {
    if (this.isRunning) {
      logger.warn('Analytics service already running');
      return;
    }

    this.isRunning = true;
    
    // Bắt đầu collect metrics
    this.startMetricsCollection();
    
    // Bắt đầu flush buffer
    this.startBufferFlush();
    
    // Khởi tạo real-time metrics
    this.initializeRealTimeMetrics();
    
    logger.startup('Analytics service started');
  }

  // Dừng analytics service
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Dừng timers
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush remaining data
    this.flushBuffers();
    
    logger.shutdown('Analytics service stopped');
  }

  // Ghi lại request
  recordRequest(requestData) {
    try {
      const record = {
        timestamp: new Date(),
        method: requestData.method,
        url: requestData.url,
        statusCode: requestData.statusCode,
        duration: requestData.duration,
        userAgent: requestData.userAgent,
        ip: requestData.ip,
        service: this.extractServiceFromUrl(requestData.url),
        userId: requestData.userId,
        error: requestData.error,
        responseSize: requestData.responseSize,
        requestSize: requestData.requestSize
      };

      // Thêm vào buffer
      this.requestBuffer.push(record);
      
      // Cập nhật real-time metrics
      this.updateRealTimeMetrics(record);
      
      // Flush buffer nếu đã đầy
      if (this.requestBuffer.length >= this.bufferSize) {
        this.flushRequestBuffer();
      }
      
    } catch (error) {
      logger.error('Error recording request:', error);
    }
  }

  // Trích xuất service name từ URL
  extractServiceFromUrl(url) {
    const match = url.match(/^\/api\/(\w+)/);
    return match ? match[1] : 'unknown';
  }

  // Cập nhật real-time metrics
  updateRealTimeMetrics(record) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Cập nhật requests per minute
    this.realTimeMetrics.requestsPerMinute++;
    
    // Cập nhật average response time
    if (this.realTimeMetrics.averageResponseTime === 0) {
      this.realTimeMetrics.averageResponseTime = record.duration;
    } else {
      this.realTimeMetrics.averageResponseTime = 
        (this.realTimeMetrics.averageResponseTime * 0.9) + (record.duration * 0.1);
    }
    
    // Cập nhật error rate
    if (record.statusCode >= 400) {
      this.realTimeMetrics.errorRate = 
        (this.realTimeMetrics.errorRate * 0.9) + (1 * 0.1);
    } else {
      this.realTimeMetrics.errorRate = this.realTimeMetrics.errorRate * 0.9;
    }
    
    // Emit real-time update
    this.emitRealTimeUpdate();
  }

  // Bắt đầu collect metrics
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectServiceMetrics();
    }, config.monitoring.metricsInterval);
  }

  // Collect service metrics
  async collectServiceMetrics() {
    try {
      const serviceRegistry = require('./serviceRegistry');
      const services = serviceRegistry.getAllServices();
      
      for (const [serviceName, serviceInfo] of Object.entries(services)) {
        const metrics = {
          serviceName,
          timestamp: new Date(),
          requestCount: serviceInfo.requestCount || 0,
          errorCount: serviceInfo.errorCount || 0,
          averageResponseTime: serviceInfo.responseTime || 0,
          uptime: serviceInfo.status === 'healthy' ? 100 : 0,
          connections: serviceInfo.instances?.reduce((sum, instance) => sum + instance.connections, 0) || 0
        };
        
        this.metricsBuffer.push(metrics);
      }
      
      // Flush metrics buffer nếu đã đầy
      if (this.metricsBuffer.length >= this.bufferSize) {
        await this.flushMetricsBuffer();
      }
      
    } catch (error) {
      logger.error('Error collecting service metrics:', error);
    }
  }

  // Bắt đầu flush buffer
  startBufferFlush() {
    this.flushTimer = setInterval(() => {
      this.flushBuffers();
    }, this.flushInterval);
  }

  // Flush tất cả buffers
  async flushBuffers() {
    await Promise.all([
      this.flushRequestBuffer(),
      this.flushMetricsBuffer()
    ]);
  }

  // Flush request buffer
  async flushRequestBuffer() {
    if (this.requestBuffer.length === 0) return;
    
    try {
      const records = [...this.requestBuffer];
      this.requestBuffer = [];
      
      await RequestAnalytics.insertMany(records);
      logger.debug(`Flushed ${records.length} request records`);
      
    } catch (error) {
      logger.error('Error flushing request buffer:', error);
      // Đưa records trở lại buffer
      this.requestBuffer.unshift(...this.requestBuffer);
    }
  }

  // Flush metrics buffer
  async flushMetricsBuffer() {
    if (this.metricsBuffer.length === 0) return;
    
    try {
      const records = [...this.metricsBuffer];
      this.metricsBuffer = [];
      
      await ServiceMetrics.insertMany(records);
      logger.debug(`Flushed ${records.length} metrics records`);
      
    } catch (error) {
      logger.error('Error flushing metrics buffer:', error);
      // Đưa records trở lại buffer
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  // Khởi tạo real-time metrics
  initializeRealTimeMetrics() {
    // Reset requests per minute mỗi phút
    setInterval(() => {
      this.realTimeMetrics.requestsPerMinute = 0;
    }, 60000);
  }

  // Emit real-time update
  emitRealTimeUpdate() {
    try {
      const io = require('../index').get('io');
      if (io) {
        io.emit('realTimeMetrics', this.realTimeMetrics);
      }
    } catch (error) {
      // Ignore errors nếu socket.io chưa ready
    }
  }

  // Lấy dashboard stats
  async getDashboardStats(timeRange = '1h') {
    try {
      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);
      
      const [requestStats, serviceStats] = await Promise.all([
        this.getRequestStats(startTime, now),
        this.getServiceStats(startTime, now)
      ]);
      
      return {
        timeRange,
        startTime,
        endTime: now,
        requests: requestStats,
        services: serviceStats,
        realTime: this.realTimeMetrics
      };
      
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      return null;
    }
  }

  // Lấy request stats
  async getRequestStats(startTime, endTime) {
    try {
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startTime, $lte: endTime }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: {
                $cond: [{ $lt: ['$statusCode', 400] }, 1, 0]
              }
            },
            errorRequests: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
              }
            },
            averageResponseTime: { $avg: '$duration' },
            minResponseTime: { $min: '$duration' },
            maxResponseTime: { $max: '$duration' },
            p95ResponseTime: { $percentile: { input: '$duration', p: [0.95] } },
            p99ResponseTime: { $percentile: { input: '$duration', p: [0.99] } }
          }
        }
      ];
      
      const result = await RequestAnalytics.aggregate(pipeline);
      
      if (result.length === 0) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          errorRequests: 0,
          errorRate: 0,
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0
        };
      }
      
      const stats = result[0];
      stats.errorRate = stats.totalRequests > 0 ? 
        (stats.errorRequests / stats.totalRequests) * 100 : 0;
      
      return stats;
      
    } catch (error) {
      logger.error('Error getting request stats:', error);
      return null;
    }
  }

  // Lấy service stats
  async getServiceStats(startTime, endTime) {
    try {
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startTime, $lte: endTime }
          }
        },
        {
          $group: {
            _id: '$serviceName',
            requestCount: { $sum: '$requestCount' },
            errorCount: { $sum: '$errorCount' },
            averageResponseTime: { $avg: '$averageResponseTime' },
            averageUptime: { $avg: '$uptime' },
            averageConnections: { $avg: '$connections' }
          }
        }
      ];
      
      const results = await ServiceMetrics.aggregate(pipeline);
      
      const serviceStats = {};
      for (const result of results) {
        serviceStats[result._id] = {
          requestCount: result.requestCount,
          errorCount: result.errorCount,
          errorRate: result.requestCount > 0 ? 
            (result.errorCount / result.requestCount) * 100 : 0,
          averageResponseTime: result.averageResponseTime,
          averageUptime: result.averageUptime,
          averageConnections: result.averageConnections
        };
      }
      
      return serviceStats;
      
    } catch (error) {
      logger.error('Error getting service stats:', error);
      return {};
    }
  }

  // Lấy top endpoints
  async getTopEndpoints(limit = 10, timeRange = '1h') {
    try {
      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startTime, $lte: now }
          }
        },
        {
          $group: {
            _id: '$url',
            count: { $sum: 1 },
            averageResponseTime: { $avg: '$duration' },
            errorCount: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ];
      
      const results = await RequestAnalytics.aggregate(pipeline);
      
      return results.map(result => ({
        url: result._id,
        count: result.count,
        averageResponseTime: result.averageResponseTime,
        errorCount: result.errorCount,
        errorRate: (result.errorCount / result.count) * 100
      }));
      
    } catch (error) {
      logger.error('Error getting top endpoints:', error);
      return [];
    }
  }

  // Lấy error analysis
  async getErrorAnalysis(timeRange = '1h') {
    try {
      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startTime, $lte: now },
            statusCode: { $gte: 400 }
          }
        },
        {
          $group: {
            _id: {
              statusCode: '$statusCode',
              url: '$url'
            },
            count: { $sum: 1 },
            averageResponseTime: { $avg: '$duration' },
            errors: { $push: '$error' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];
      
      const results = await RequestAnalytics.aggregate(pipeline);
      
      return results.map(result => ({
        statusCode: result._id.statusCode,
        url: result._id.url,
        count: result.count,
        averageResponseTime: result.averageResponseTime,
        errors: result.errors.filter(e => e).slice(0, 5)
      }));
      
    } catch (error) {
      logger.error('Error getting error analysis:', error);
      return [];
    }
  }

  // Parse time range
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // default 1 hour
    }
  }

  // Lấy real-time metrics
  getRealTimeMetrics() {
    return this.realTimeMetrics;
  }

  // Lấy status của analytics service
  getStatus() {
    return {
      isRunning: this.isRunning,
      requestBufferSize: this.requestBuffer.length,
      metricsBufferSize: this.metricsBuffer.length,
      flushInterval: this.flushInterval,
      metricsInterval: config.monitoring.metricsInterval,
      cacheSize: this.cache.size,
      realTimeMetrics: this.realTimeMetrics
    };
  }
}

// Tạo singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService; 