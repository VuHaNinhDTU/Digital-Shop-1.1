require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    name: process.env.API_GATEWAY_NAME || 'cho-nong-san-so-gateway'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-gateway-auth',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    slowDownDelayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 50,
    slowDownDelayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cho-nong-san-so-gateway',
    options: {
      connectTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 30000,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    }
  },

  // Microservices Configuration
  services: {
    product: {
      name: 'product-service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
      path: '/api/products',
      healthCheck: '/health'
    },
    order: {
      name: 'order-service', 
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
      path: '/api/orders',
      healthCheck: '/health'
    },
    user: {
      name: 'user-service',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3002', 
      path: '/api/users',
      healthCheck: '/health'
    }
  },

  // Health Check Configuration
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
    retries: parseInt(process.env.HEALTH_CHECK_RETRIES) || 3
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    format: 'combined'
  },

  // Dashboard Configuration
  dashboard: {
    enabled: process.env.DASHBOARD_ENABLED === 'true' || true,
    authRequired: process.env.DASHBOARD_AUTH_REQUIRED === 'true' || true,
    username: process.env.DASHBOARD_USERNAME || 'admin',
    password: process.env.DASHBOARD_PASSWORD || 'admin123',
    path: '/dashboard'
  },

  // WebSocket Configuration
  socketIO: {
    enabled: process.env.SOCKET_IO_ENABLED === 'true' || true,
    corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
    pingTimeout: 60000,
    pingInterval: 25000
  },

  // Proxy Configuration
  proxy: {
    timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
    changeOrigin: process.env.PROXY_CHANGE_ORIGIN === 'true' || true,
    followRedirects: process.env.PROXY_FOLLOW_REDIRECTS === 'true' || true
  },

  // Load Balancer Configuration
  loadBalancer: {
    strategy: process.env.LOAD_BALANCER_STRATEGY || 'round-robin',
    healthCheck: process.env.LOAD_BALANCER_HEALTH_CHECK === 'true' || true
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },

  // Monitoring & Analytics
  monitoring: {
    analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true' || true,
    metricsInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL) || 60000,
    requestLogging: process.env.REQUEST_LOGGING_ENABLED === 'true' || true
  },

  // Development Settings
  development: {
    debug: process.env.DEBUG || 'api-gateway:*',
    mockServices: process.env.MOCK_SERVICES === 'true' || false,
    autoRegisterServices: process.env.AUTO_REGISTER_SERVICES === 'true' || true
  }
};

module.exports = config; 