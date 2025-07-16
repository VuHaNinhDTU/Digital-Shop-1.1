const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.loadBalancers = new Map();
    this.healthCheckInterval = null;
    this.isInitialized = false;
  }

  // Khởi tạo service registry
  async initialize() {
    try {
      // Khởi tạo services từ config
      await this.registerServicesFromConfig();
      
      // Khởi tạo load balancers
      this.initializeLoadBalancers();
      
      // Bắt đầu auto-discovery nếu được bật
      if (config.development.autoRegisterServices) {
        await this.autoDiscoverServices();
      }
      
      this.isInitialized = true;
      logger.startup('Service registry initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize service registry:', error);
      throw error;
    }
  }

  // Đăng ký services từ config
  async registerServicesFromConfig() {
    const services = config.services;
    
    for (const [key, serviceConfig] of Object.entries(services)) {
      const serviceInfo = {
        id: `${serviceConfig.name}-${Date.now()}`,
        name: serviceConfig.name,
        url: serviceConfig.url,
        path: serviceConfig.path,
        healthCheck: serviceConfig.healthCheck,
        status: 'unknown',
        lastHealthCheck: null,
        responseTime: null,
        errorCount: 0,
        requestCount: 0,
        instances: [
          {
            id: `${serviceConfig.name}-instance-1`,
            url: serviceConfig.url,
            status: 'unknown',
            weight: 1,
            connections: 0,
            lastUsed: null,
            responseTime: null
          }
        ],
        metadata: {
          version: '1.0.0',
          tags: ['microservice', key],
          createdAt: new Date()
        }
      };

      this.services.set(serviceConfig.name, serviceInfo);
      logger.info(`Registered service: ${serviceConfig.name} at ${serviceConfig.url}`);
    }
  }

  // Tự động khám phá services
  async autoDiscoverServices() {
    logger.info('Starting auto-discovery of services...');
    
    // Kiểm tra health của tất cả services
    for (const [serviceName, serviceInfo] of this.services) {
      try {
        const health = await this.checkServiceHealth(serviceName);
        this.updateServiceStatus(serviceName, health);
      } catch (error) {
        logger.error(`Auto-discovery failed for ${serviceName}:`, error);
      }
    }
  }

  // Khởi tạo load balancers
  initializeLoadBalancers() {
    for (const [serviceName, serviceInfo] of this.services) {
      this.loadBalancers.set(serviceName, {
        strategy: config.loadBalancer.strategy,
        roundRobinIndex: 0,
        healthyInstances: [],
        metrics: {
          totalRequests: 0,
          averageResponseTime: 0,
          errorRate: 0
        }
      });
    }
  }

  // Đăng ký service mới
  async registerService(serviceConfig) {
    try {
      const serviceInfo = {
        id: `${serviceConfig.name}-${Date.now()}`,
        name: serviceConfig.name,
        url: serviceConfig.url,
        path: serviceConfig.path || '/',
        healthCheck: serviceConfig.healthCheck || '/health',
        status: 'unknown',
        lastHealthCheck: null,
        responseTime: null,
        errorCount: 0,
        requestCount: 0,
        instances: [
          {
            id: `${serviceConfig.name}-instance-${Date.now()}`,
            url: serviceConfig.url,
            status: 'unknown',
            weight: serviceConfig.weight || 1,
            connections: 0,
            lastUsed: null,
            responseTime: null
          }
        ],
        metadata: {
          version: serviceConfig.version || '1.0.0',
          tags: serviceConfig.tags || ['microservice'],
          createdAt: new Date()
        }
      };

      this.services.set(serviceConfig.name, serviceInfo);
      
      // Thêm load balancer
      this.loadBalancers.set(serviceConfig.name, {
        strategy: config.loadBalancer.strategy,
        roundRobinIndex: 0,
        healthyInstances: [],
        metrics: {
          totalRequests: 0,
          averageResponseTime: 0,
          errorRate: 0
        }
      });

      // Kiểm tra health ngay lập tức
      await this.checkServiceHealth(serviceConfig.name);

      logger.info(`Service registered: ${serviceConfig.name}`);
      return serviceInfo;

    } catch (error) {
      logger.error(`Failed to register service ${serviceConfig.name}:`, error);
      throw error;
    }
  }

  // Hủy đăng ký service
  unregisterService(serviceName) {
    try {
      this.services.delete(serviceName);
      this.loadBalancers.delete(serviceName);
      logger.info(`Service unregistered: ${serviceName}`);
    } catch (error) {
      logger.error(`Failed to unregister service ${serviceName}:`, error);
      throw error;
    }
  }

  // Kiểm tra health của service
  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const startTime = Date.now();
    let healthStatus = 'unhealthy';
    let errorMessage = null;

    try {
      // Kiểm tra tất cả instances
      for (const instance of service.instances) {
        const instanceStartTime = Date.now();
        
        try {
          const response = await axios.get(
            `${instance.url}${service.healthCheck}`,
            {
              timeout: config.healthCheck.timeout,
              headers: {
                'User-Agent': 'API-Gateway-Health-Check',
                'X-Health-Check': 'true'
              }
            }
          );

          const responseTime = Date.now() - instanceStartTime;
          
          if (response.status === 200) {
            instance.status = 'healthy';
            instance.responseTime = responseTime;
            healthStatus = 'healthy';
          } else {
            instance.status = 'unhealthy';
            instance.responseTime = responseTime;
          }

        } catch (error) {
          instance.status = 'unhealthy';
          instance.responseTime = Date.now() - instanceStartTime;
          errorMessage = error.message;
        }
      }

      // Cập nhật status tổng thể
      const healthyInstances = service.instances.filter(i => i.status === 'healthy');
      service.status = healthyInstances.length > 0 ? 'healthy' : 'unhealthy';
      service.lastHealthCheck = new Date();
      service.responseTime = Date.now() - startTime;

      // Cập nhật load balancer
      const loadBalancer = this.loadBalancers.get(serviceName);
      if (loadBalancer) {
        loadBalancer.healthyInstances = healthyInstances;
      }

      logger.serviceHealth(serviceName, service.status, service.responseTime);

      return {
        status: service.status,
        responseTime: service.responseTime,
        healthyInstances: healthyInstances.length,
        totalInstances: service.instances.length,
        error: errorMessage
      };

    } catch (error) {
      service.status = 'unhealthy';
      service.lastHealthCheck = new Date();
      service.responseTime = Date.now() - startTime;
      
      logger.error(`Health check failed for ${serviceName}:`, error);
      
      return {
        status: 'unhealthy',
        responseTime: service.responseTime,
        error: error.message
      };
    }
  }

  // Cập nhật status service
  updateServiceStatus(serviceName, healthInfo) {
    const service = this.services.get(serviceName);
    if (service) {
      service.status = healthInfo.status;
      service.responseTime = healthInfo.responseTime;
      service.lastHealthCheck = new Date();
    }
  }

  // Lấy instance tốt nhất để route request
  getNextInstance(serviceName) {
    const service = this.services.get(serviceName);
    const loadBalancer = this.loadBalancers.get(serviceName);

    if (!service || !loadBalancer) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const { healthyInstances } = loadBalancer;
    
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances available for service ${serviceName}`);
    }

    let selectedInstance;

    switch (loadBalancer.strategy) {
      case 'round-robin':
        selectedInstance = this.getRoundRobinInstance(loadBalancer, healthyInstances);
        break;
      case 'least-connections':
        selectedInstance = this.getLeastConnectionsInstance(healthyInstances);
        break;
      case 'weighted':
        selectedInstance = this.getWeightedInstance(healthyInstances);
        break;
      case 'response-time':
        selectedInstance = this.getFastestResponseInstance(healthyInstances);
        break;
      default:
        selectedInstance = healthyInstances[0];
    }

    // Cập nhật metrics
    selectedInstance.connections++;
    selectedInstance.lastUsed = new Date();
    service.requestCount++;
    loadBalancer.metrics.totalRequests++;

    return selectedInstance;
  }

  // Round-robin load balancing
  getRoundRobinInstance(loadBalancer, healthyInstances) {
    const index = loadBalancer.roundRobinIndex % healthyInstances.length;
    loadBalancer.roundRobinIndex++;
    return healthyInstances[index];
  }

  // Least connections load balancing
  getLeastConnectionsInstance(healthyInstances) {
    return healthyInstances.reduce((min, instance) => 
      instance.connections < min.connections ? instance : min
    );
  }

  // Weighted load balancing
  getWeightedInstance(healthyInstances) {
    const totalWeight = healthyInstances.reduce((sum, instance) => sum + instance.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const instance of healthyInstances) {
      currentWeight += instance.weight;
      if (random <= currentWeight) {
        return instance;
      }
    }

    return healthyInstances[0];
  }

  // Fastest response time load balancing
  getFastestResponseInstance(healthyInstances) {
    return healthyInstances.reduce((fastest, instance) => 
      (instance.responseTime || Infinity) < (fastest.responseTime || Infinity) ? instance : fastest
    );
  }

  // Record request completion
  recordRequestCompletion(serviceName, instanceId, responseTime, statusCode) {
    const service = this.services.get(serviceName);
    if (service) {
      const instance = service.instances.find(i => i.id === instanceId);
      if (instance) {
        instance.connections = Math.max(0, instance.connections - 1);
        instance.responseTime = responseTime;
        
        if (statusCode >= 400) {
          service.errorCount++;
        }
      }

      // Cập nhật load balancer metrics
      const loadBalancer = this.loadBalancers.get(serviceName);
      if (loadBalancer) {
        const metrics = loadBalancer.metrics;
        metrics.averageResponseTime = 
          (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;
        metrics.errorRate = service.errorCount / service.requestCount;
      }
    }
  }

  // Lấy tất cả services
  getAllServices() {
    const services = {};
    
    for (const [name, service] of this.services) {
      services[name] = {
        ...service,
        loadBalancer: this.loadBalancers.get(name)
      };
    }
    
    return services;
  }

  // Lấy service theo tên
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  // Lấy service statistics
  getServiceStats(serviceName) {
    const service = this.services.get(serviceName);
    const loadBalancer = this.loadBalancers.get(serviceName);

    if (!service || !loadBalancer) {
      return null;
    }

    return {
      name: serviceName,
      status: service.status,
      instances: service.instances.length,
      healthyInstances: loadBalancer.healthyInstances.length,
      totalRequests: service.requestCount,
      errorCount: service.errorCount,
      errorRate: service.requestCount > 0 ? (service.errorCount / service.requestCount) * 100 : 0,
      averageResponseTime: loadBalancer.metrics.averageResponseTime,
      lastHealthCheck: service.lastHealthCheck
    };
  }

  // Lấy tổng quan hệ thống
  getSystemOverview() {
    const services = Array.from(this.services.values());
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalRequests = services.reduce((sum, s) => sum + s.requestCount, 0);
    const totalErrors = services.reduce((sum, s) => sum + s.errorCount, 0);

    return {
      totalServices,
      healthyServices,
      unhealthyServices: totalServices - healthyServices,
      totalRequests,
      totalErrors,
      systemErrorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }
}

// Tạo singleton instance
const serviceRegistry = new ServiceRegistry();

module.exports = serviceRegistry; 