const mongoose = require('mongoose');

// Schema cho service instances
const instanceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  status: {
    type: String,
    enum: ['healthy', 'unhealthy', 'unknown'],
    default: 'unknown'
  },
  weight: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  connections: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },
  responseTime: {
    type: Number,
    default: null,
    min: 0
  },
  metadata: {
    region: String,
    zone: String,
    version: String,
    tags: [String]
  }
}, {
  _id: false
});

// Schema cho service metadata
const metadataSchema = new mongoose.Schema({
  version: {
    type: String,
    default: '1.0.0'
  },
  description: String,
  owner: String,
  team: String,
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false
});

// Schema cho service load balancer config
const loadBalancerSchema = new mongoose.Schema({
  strategy: {
    type: String,
    enum: ['round-robin', 'least-connections', 'weighted', 'response-time'],
    default: 'round-robin'
  },
  healthCheckEnabled: {
    type: Boolean,
    default: true
  },
  healthCheckInterval: {
    type: Number,
    default: 30000,
    min: 5000
  },
  healthCheckTimeout: {
    type: Number,
    default: 5000,
    min: 1000
  },
  healthCheckPath: {
    type: String,
    default: '/health'
  },
  retries: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  }
}, {
  _id: false
});

// Main service schema
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  path: {
    type: String,
    default: '/',
    trim: true
  },
  port: {
    type: Number,
    min: 1,
    max: 65535
  },
  protocol: {
    type: String,
    enum: ['http', 'https'],
    default: 'http'
  },
  status: {
    type: String,
    enum: ['healthy', 'unhealthy', 'unknown', 'maintenance'],
    default: 'unknown'
  },
  lastHealthCheck: {
    type: Date,
    default: null
  },
  responseTime: {
    type: Number,
    default: null,
    min: 0
  },
  uptime: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  requestCount: {
    type: Number,
    default: 0,
    min: 0
  },
  errorCount: {
    type: Number,
    default: 0,
    min: 0
  },
  successCount: {
    type: Number,
    default: 0,
    min: 0
  },
  instances: [instanceSchema],
  loadBalancer: loadBalancerSchema,
  metadata: metadataSchema,
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'services'
});

// Indexes
serviceSchema.index({ name: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ lastHealthCheck: 1 });
serviceSchema.index({ 'metadata.environment': 1 });
serviceSchema.index({ 'metadata.tags': 1 });
serviceSchema.index({ registeredAt: 1 });

// Virtual fields
serviceSchema.virtual('errorRate').get(function() {
  if (this.requestCount === 0) return 0;
  return (this.errorCount / this.requestCount) * 100;
});

serviceSchema.virtual('successRate').get(function() {
  if (this.requestCount === 0) return 0;
  return (this.successCount / this.requestCount) * 100;
});

serviceSchema.virtual('healthyInstances').get(function() {
  return this.instances.filter(instance => instance.status === 'healthy');
});

serviceSchema.virtual('unhealthyInstances').get(function() {
  return this.instances.filter(instance => instance.status === 'unhealthy');
});

serviceSchema.virtual('totalInstances').get(function() {
  return this.instances.length;
});

serviceSchema.virtual('isHealthy').get(function() {
  return this.status === 'healthy' && this.healthyInstances.length > 0;
});

// Methods
serviceSchema.methods.updateHealth = function(healthData) {
  this.status = healthData.status;
  this.lastHealthCheck = new Date();
  this.responseTime = healthData.responseTime;
  this.lastSeen = new Date();
  
  if (healthData.instances) {
    this.instances.forEach(instance => {
      const instanceHealth = healthData.instances.find(i => i.id === instance.id);
      if (instanceHealth) {
        instance.status = instanceHealth.status;
        instance.responseTime = instanceHealth.responseTime;
      }
    });
  }
  
  return this.save();
};

serviceSchema.methods.addInstance = function(instanceData) {
  const instance = {
    id: instanceData.id || `${this.name}-instance-${Date.now()}`,
    url: instanceData.url,
    weight: instanceData.weight || 1,
    metadata: instanceData.metadata || {}
  };
  
  this.instances.push(instance);
  return this.save();
};

serviceSchema.methods.removeInstance = function(instanceId) {
  this.instances = this.instances.filter(instance => instance.id !== instanceId);
  return this.save();
};

serviceSchema.methods.incrementRequestCount = function() {
  this.requestCount++;
  this.lastSeen = new Date();
  return this.save();
};

serviceSchema.methods.incrementErrorCount = function() {
  this.errorCount++;
  this.lastSeen = new Date();
  return this.save();
};

serviceSchema.methods.incrementSuccessCount = function() {
  this.successCount++;
  this.lastSeen = new Date();
  return this.save();
};

serviceSchema.methods.updateMetadata = function(metadata) {
  this.metadata = { ...this.metadata, ...metadata, updatedAt: new Date() };
  return this.save();
};

serviceSchema.methods.getHealthSummary = function() {
  return {
    name: this.name,
    status: this.status,
    uptime: this.uptime,
    responseTime: this.responseTime,
    errorRate: this.errorRate,
    successRate: this.successRate,
    instances: {
      total: this.totalInstances,
      healthy: this.healthyInstances.length,
      unhealthy: this.unhealthyInstances.length
    },
    lastHealthCheck: this.lastHealthCheck,
    lastSeen: this.lastSeen
  };
};

// Static methods
serviceSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true });
};

serviceSchema.statics.findHealthyServices = function() {
  return this.find({ status: 'healthy', isActive: true });
};

serviceSchema.statics.findUnhealthyServices = function() {
  return this.find({ status: 'unhealthy', isActive: true });
};

serviceSchema.statics.getServiceStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalServices: { $sum: 1 },
        healthyServices: {
          $sum: { $cond: [{ $eq: ['$status', 'healthy'] }, 1, 0] }
        },
        unhealthyServices: {
          $sum: { $cond: [{ $eq: ['$status', 'unhealthy'] }, 1, 0] }
        },
        totalRequests: { $sum: '$requestCount' },
        totalErrors: { $sum: '$errorCount' },
        averageResponseTime: { $avg: '$responseTime' },
        totalInstances: { $sum: { $size: '$instances' } }
      }
    }
  ]);
};

serviceSchema.statics.cleanupOldServices = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    { lastSeen: { $lt: cutoffDate } },
    { $set: { isActive: false } }
  );
};

// Pre-save middleware
serviceSchema.pre('save', function(next) {
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  if (this.isModified('instances')) {
    this.lastSeen = new Date();
  }
  
  next();
});

// Pre-update middleware
serviceSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastSeen: new Date() });
  next();
});

// Export model
module.exports = mongoose.model('Service', serviceSchema); 