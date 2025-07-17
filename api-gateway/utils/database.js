const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

// Tạo connection options
const connectionOptions = {
  ...config.database.options
};

// Connection state tracking
let isConnected = false;

// Database connection function
const connectDB = async () => {
  try {
    // Avoid re-connecting if already connected
    if (isConnected) {
      logger.info('Database already connected');
      return;
    }

    // Connect to MongoDB
    const connection = await mongoose.connect(config.database.uri, connectionOptions);
    
    isConnected = true;
    
    logger.startup(`Database connected successfully to: ${connection.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Database connected');
      isConnected = true;
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
      isConnected = false;
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.shutdown('Database connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    isConnected = false;
    
    // Retry connection after 5 seconds
    setTimeout(() => {
      logger.info('Retrying database connection...');
      connectDB();
    }, 5000);
  }
};

// Health check function
const checkDBHealth = async () => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const duration = Date.now() - startTime;
    
    logger.database('health-check', 'admin', duration);
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Get database statistics
const getDBStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      objects: stats.objects,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return null;
  }
};

// Close database connection
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.shutdown('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Connection status getter
const getConnectionStatus = () => {
  return {
    isConnected: isConnected,
    readyState: mongoose.connection.readyState,
    readyStateDescription: getReadyStateDescription(mongoose.connection.readyState),
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

// Helper function to get readable connection state
const getReadyStateDescription = (state) => {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  getDBStats,
  closeDB,
  getConnectionStatus,
  mongoose
}; 