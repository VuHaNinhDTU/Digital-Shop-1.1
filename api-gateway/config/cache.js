// Cache Configuration
module.exports = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'cho-nong-san:',
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnMissing: 100,
    connectTimeout: 10000,
    commandTimeout: 5000
  },
  
  // Cache TTL settings (in seconds)
  ttl: {
    products: 600,        // 10 phút
    categories: 1800,     // 30 phút
    users: 300,           // 5 phút
    search: 180,          // 3 phút
    default: 300          // 5 phút
  },
  
  // Cache strategies
  strategies: {
    // Cache all GET requests for products
    products: {
      methods: ['GET'],
      ttl: 600,
      exclude: ['/api/products/*/reviews'] // Exclude reviews from cache
    },
    
    // Cache user profiles but not sensitive data
    users: {
      methods: ['GET'],
      ttl: 300,
      exclude: ['/api/users/*/orders', '/api/users/*/payment-methods']
    },
    
    // Don't cache orders at all
    orders: {
      enabled: false
    }
  },
  
  // Cache invalidation patterns
  invalidation: {
    // When product is updated/created, invalidate all product-related cache
    product: [
      'cache:GET:/api/products*',
      'cache:GET:/api/categories*',
      'cache:GET:/api/search*'
    ],
    
    // When user is updated, invalidate user-related cache
    user: [
      'cache:GET:/api/users*'
    ]
  }
}; 