const mongoose = require('mongoose');

// Schema cho health check result
const healthCheckResultSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true
  },
  instanceUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['healthy', 'unhealthy', 'timeout', 'error'],
    required: true
  },
  responseTime: {
    type: Number,
    min: 0,
    required: true
  },
  statusCode: {
    type: Number,
    min: 100,
    max: 599
  },
  errorMessage: {
    type: String,
    maxlength: 1000
  },
  responseBody: {
    type: String,
    maxlength: 5000
  },
  headers: {
    type: Map,
    of: String
  }
}, {
  _id: false
});

// Main health check log schema
const healthCheckLogSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  checkId: {
    type: String,
    required: true,
    unique: true,
    default: () => `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  overallStatus: {
    type: String,
    enum: ['healthy', 'unhealthy', 'partial', 'error'],
    required: true
  },
  totalResponseTime: {
    type: Number,
    min: 0,
    required: true
  },
  healthyInstances: {
    type: Number,
    min: 0,
    default: 0
  },
  unhealthyInstances: {
    type: Number,
    min: 0,
    default: 0
  },
  totalInstances: {
    type: Number,
    min: 0,
    required: true
  },
  results: [healthCheckResultSchema],
  metadata: {
    triggeredBy: {
      type: String,
      enum: ['scheduled', 'manual', 'api', 'alert'],
      default: 'scheduled'
    },
    retryCount: {
      type: Number,
      min: 0,
      default: 0
    },
    timeout: {
      type: Number,
      min: 0,
      default: 5000
    },
    userAgent: {
      type: String,
      default: 'API-Gateway-Health-Check'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    tags: [String]
  },
  alerts: [{
    type: {
      type: String,
      enum: ['consecutive_failures', 'slow_response', 'high_error_rate', 'service_down'],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    triggered: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    acknowledgedBy: {
      type: String,
      default: null
    }
  }]
}, {
  timestamps: true,
  collection: 'health_check_logs'
});

// Indexes
healthCheckLogSchema.index({ serviceName: 1, timestamp: -1 });
healthCheckLogSchema.index({ serviceId: 1, timestamp: -1 });
healthCheckLogSchema.index({ overallStatus: 1 });
healthCheckLogSchema.index({ timestamp: -1 });
healthCheckLogSchema.index({ 'metadata.triggeredBy': 1 });
healthCheckLogSchema.index({ 'metadata.environment': 1 });
healthCheckLogSchema.index({ 'alerts.type': 1 });
healthCheckLogSchema.index({ 'alerts.severity': 1 });
healthCheckLogSchema.index({ 'alerts.triggered': 1 });

// Virtual fields
healthCheckLogSchema.virtual('healthPercentage').get(function() {
  if (this.totalInstances === 0) return 0;
  return (this.healthyInstances / this.totalInstances) * 100;
});

healthCheckLogSchema.virtual('isHealthy').get(function() {
  return this.overallStatus === 'healthy';
});

healthCheckLogSchema.virtual('hasAlerts').get(function() {
  return this.alerts.length > 0;
});

healthCheckLogSchema.virtual('unacknowledgedAlerts').get(function() {
  return this.alerts.filter(alert => alert.triggered && !alert.acknowledgedAt);
});

// Methods
healthCheckLogSchema.methods.addResult = function(instanceResult) {
  this.results.push(instanceResult);
  
  // Update counters
  if (instanceResult.status === 'healthy') {
    this.healthyInstances++;
  } else {
    this.unhealthyInstances++;
  }
  
  this.totalInstances = this.results.length;
  
  // Update overall status
  this.updateOverallStatus();
  
  return this;
};

healthCheckLogSchema.methods.updateOverallStatus = function() {
  if (this.totalInstances === 0) {
    this.overallStatus = 'error';
  } else if (this.healthyInstances === this.totalInstances) {
    this.overallStatus = 'healthy';
  } else if (this.healthyInstances === 0) {
    this.overallStatus = 'unhealthy';
  } else {
    this.overallStatus = 'partial';
  }
  
  return this;
};

healthCheckLogSchema.methods.addAlert = function(alertData) {
  const alert = {
    type: alertData.type,
    severity: alertData.severity,
    message: alertData.message,
    triggered: true
  };
  
  this.alerts.push(alert);
  return this.save();
};

healthCheckLogSchema.methods.acknowledgeAlert = function(alertId, acknowledgedBy) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    return this.save();
  }
  return Promise.resolve(this);
};

healthCheckLogSchema.methods.acknowledgeAllAlerts = function(acknowledgedBy) {
  this.alerts.forEach(alert => {
    if (alert.triggered && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
    }
  });
  return this.save();
};

healthCheckLogSchema.methods.getSummary = function() {
  return {
    checkId: this.checkId,
    serviceName: this.serviceName,
    timestamp: this.timestamp,
    overallStatus: this.overallStatus,
    totalResponseTime: this.totalResponseTime,
    healthPercentage: this.healthPercentage,
    instances: {
      total: this.totalInstances,
      healthy: this.healthyInstances,
      unhealthy: this.unhealthyInstances
    },
    alerts: this.alerts.length,
    unacknowledgedAlerts: this.unacknowledgedAlerts.length,
    triggeredBy: this.metadata.triggeredBy
  };
};

// Static methods
healthCheckLogSchema.statics.findByService = function(serviceName, limit = 50) {
  return this.find({ serviceName })
    .sort({ timestamp: -1 })
    .limit(limit);
};

healthCheckLogSchema.statics.findByStatus = function(status, limit = 100) {
  return this.find({ overallStatus: status })
    .sort({ timestamp: -1 })
    .limit(limit);
};

healthCheckLogSchema.statics.findRecentLogs = function(minutes = 60, limit = 100) {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  return this.find({ timestamp: { $gte: cutoffTime } })
    .sort({ timestamp: -1 })
    .limit(limit);
};

healthCheckLogSchema.statics.getServiceHealthStats = function(serviceName, hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        serviceName,
        timestamp: { $gte: cutoffTime }
      }
    },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        healthyChecks: {
          $sum: { $cond: [{ $eq: ['$overallStatus', 'healthy'] }, 1, 0] }
        },
        unhealthyChecks: {
          $sum: { $cond: [{ $eq: ['$overallStatus', 'unhealthy'] }, 1, 0] }
        },
        partialChecks: {
          $sum: { $cond: [{ $eq: ['$overallStatus', 'partial'] }, 1, 0] }
        },
        averageResponseTime: { $avg: '$totalResponseTime' },
        maxResponseTime: { $max: '$totalResponseTime' },
        minResponseTime: { $min: '$totalResponseTime' },
        totalAlerts: { $sum: { $size: '$alerts' } },
        lastCheck: { $max: '$timestamp' }
      }
    }
  ]);
};

healthCheckLogSchema.statics.getSystemHealthOverview = function(hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoffTime }
      }
    },
    {
      $group: {
        _id: '$serviceName',
        totalChecks: { $sum: 1 },
        healthyChecks: {
          $sum: { $cond: [{ $eq: ['$overallStatus', 'healthy'] }, 1, 0] }
        },
        lastStatus: { $last: '$overallStatus' },
        lastCheck: { $max: '$timestamp' },
        averageResponseTime: { $avg: '$totalResponseTime' },
        totalAlerts: { $sum: { $size: '$alerts' } }
      }
    },
    {
      $project: {
        serviceName: '$_id',
        totalChecks: 1,
        healthyChecks: 1,
        uptime: {
          $multiply: [
            { $divide: ['$healthyChecks', '$totalChecks'] },
            100
          ]
        },
        lastStatus: 1,
        lastCheck: 1,
        averageResponseTime: 1,
        totalAlerts: 1
      }
    },
    {
      $sort: { uptime: -1 }
    }
  ]);
};

healthCheckLogSchema.statics.findUnacknowledgedAlerts = function(severity = null) {
  const matchConditions = {
    'alerts.triggered': true,
    'alerts.acknowledgedAt': null
  };
  
  if (severity) {
    matchConditions['alerts.severity'] = severity;
  }
  
  return this.find(matchConditions)
    .sort({ timestamp: -1 });
};

healthCheckLogSchema.statics.getAlertsStats = function(hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoffTime },
        'alerts.0': { $exists: true }
      }
    },
    {
      $unwind: '$alerts'
    },
    {
      $group: {
        _id: {
          type: '$alerts.type',
          severity: '$alerts.severity'
        },
        count: { $sum: 1 },
        acknowledged: {
          $sum: { $cond: [{ $ne: ['$alerts.acknowledgedAt', null] }, 1, 0] }
        },
        unacknowledged: {
          $sum: { $cond: [{ $eq: ['$alerts.acknowledgedAt', null] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

healthCheckLogSchema.statics.cleanupOldLogs = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

// Pre-save middleware
healthCheckLogSchema.pre('save', function(next) {
  if (this.isNew) {
    this.updateOverallStatus();
  }
  next();
});

// Export model
module.exports = mongoose.model('HealthCheckLog', healthCheckLogSchema); 