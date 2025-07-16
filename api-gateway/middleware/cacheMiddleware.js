const redis = require('redis');
const logger = require('../utils/logger');
const cacheConfig = require('../config/cache');

class CacheMiddleware {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  // Khởi tạo Redis client
  async init() {
    try {
      this.client = redis.createClient({
        host: cacheConfig.redis.host,
        port: cacheConfig.redis.port,
        password: cacheConfig.redis.password,
        db: cacheConfig.redis.db,
        retryDelayOnFailover: cacheConfig.redis.retryDelayOnFailover,
        enableOfflineQueue: cacheConfig.redis.enableOfflineQueue,
        lazyConnect: cacheConfig.redis.lazyConnect,
        maxRetriesPerRequest: cacheConfig.redis.maxRetriesPerRequest,
        connectTimeout: cacheConfig.redis.connectTimeout,
        commandTimeout: cacheConfig.redis.commandTimeout
      });

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error(`Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      logger.error(`Failed to connect to Redis: ${error.message}`);
      this.isConnected = false;
    }
  }

  // Tạo cache key dựa trên request
  generateCacheKey(req) {
    const { method, originalUrl, query, user } = req;
    
    // Bao gồm user ID nếu có để tránh cache leak
    const userId = user ? user.id : 'guest';
    
    // Tạo key từ method, URL, query params
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');
    
    return `${cacheConfig.redis.keyPrefix}cache:${method}:${originalUrl}:${queryString}:${userId}`;
  }

  // Middleware chính cho caching
  cache(duration = cacheConfig.ttl.default) { // Default từ config
    return async (req, res, next) => {
      // Chỉ cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Nếu Redis không connected, skip cache
      if (!this.isConnected) {
        return next();
      }

      try {
        const cacheKey = this.generateCacheKey(req);
        
        // Kiểm tra cache
        const cachedData = await this.client.get(cacheKey);
        
        if (cachedData) {
          logger.info(`Cache HIT: ${cacheKey}`);
          
          // Parse và trả về cached data
          const data = JSON.parse(cachedData);
          
          // Thêm header để biết là từ cache
          res.set({
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            'Content-Type': 'application/json'
          });
          
          return res.json(data);
        }

        // Cache MISS - tiếp tục request
        logger.info(`Cache MISS: ${cacheKey}`);
        
        // Override res.json để cache response
        const originalJson = res.json;
        res.json = async function(data) {
          try {
            // Chỉ cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
              await this.client.setEx(cacheKey, duration, JSON.stringify(data));
              logger.info(`Cached response: ${cacheKey} for ${duration}s`);
            }
          } catch (error) {
            logger.error(`Failed to cache response: ${error.message}`);
          }
          
          // Set cache headers
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey
          });
          
          // Call original json method
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        logger.error(`Cache middleware error: ${error.message}`);
        next();
      }
    };
  }

  // Xóa cache theo pattern
  async invalidateCache(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to invalidate cache: ${error.message}`);
      return false;
    }
  }

  // Xóa cache cho specific routes
  async invalidateProductCache() {
    return await this.invalidateCache('cache:GET:/api/products*');
  }

  async invalidateOrderCache(userId) {
    return await this.invalidateCache(`cache:GET:/api/orders*:${userId}`);
  }

  // Health check cho cache
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Redis not connected' };
      }
      
      await this.client.ping();
      return { status: 'healthy', message: 'Redis connected and responsive' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new CacheMiddleware(); 