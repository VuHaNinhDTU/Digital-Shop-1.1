const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// Định nghĩa custom levels và colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Thêm colors cho winston
winston.addColors(customLevels.colors);

// Custom format cho logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Custom format cho console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

// Tạo log directory nếu chưa tồn tại
const logDirectory = path.resolve(config.logging.directory);
require('fs').mkdirSync(logDirectory, { recursive: true });

// Cấu hình transports
const transports = [];

// Console transport (chỉ trong development)
if (config.server.env === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );
}

// File transport cho tất cả logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logDirectory, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: customFormat,
    level: config.logging.level
  })
);

// File transport cho errors
transports.push(
  new DailyRotateFile({
    filename: path.join(logDirectory, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: customFormat,
    level: 'error'
  })
);

// File transport cho HTTP requests
transports.push(
  new DailyRotateFile({
    filename: path.join(logDirectory, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: customFormat,
    level: 'http'
  })
);

// Tạo winston logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: customFormat,
  transports: transports,
  exitOnError: false,
  
  // Exception và rejection handling
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDirectory, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: customFormat
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDirectory, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: customFormat
    })
  ]
});

// Thêm các method tiện ích
logger.request = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
};

logger.apiCall = (serviceName, method, url, statusCode, duration) => {
  logger.info(`API Call: ${serviceName} ${method} ${url} - ${statusCode} - ${duration}ms`);
};

logger.serviceHealth = (serviceName, status, responseTime) => {
  const level = status === 'healthy' ? 'info' : 'warn';
  logger.log(level, `Service Health: ${serviceName} - ${status} - ${responseTime}ms`);
};

logger.security = (event, details) => {
  logger.warn(`Security Event: ${event} - ${JSON.stringify(details)}`);
};

logger.performance = (metric, value, unit = 'ms') => {
  logger.info(`Performance: ${metric} - ${value}${unit}`);
};

logger.database = (operation, collection, duration) => {
  logger.debug(`Database: ${operation} on ${collection} - ${duration}ms`);
};

logger.cache = (operation, key, hit = null) => {
  const hitStatus = hit !== null ? (hit ? 'HIT' : 'MISS') : '';
  logger.debug(`Cache: ${operation} ${key} ${hitStatus}`);
};

logger.websocket = (event, socketId, data = null) => {
  logger.info(`WebSocket: ${event} - ${socketId} - ${data ? JSON.stringify(data) : 'no data'}`);
};

logger.startup = (message) => {
  logger.info(`🚀 ${message}`);
};

logger.shutdown = (message) => {
  logger.info(`🛑 ${message}`);
};

// Event listeners cho log rotation
logger.transports.forEach(transport => {
  if (transport instanceof DailyRotateFile) {
    transport.on('rotate', (oldFilename, newFilename) => {
      logger.info(`Log rotated: ${oldFilename} -> ${newFilename}`);
    });
    
    transport.on('archive', (zipFilename) => {
      logger.info(`Log archived: ${zipFilename}`);
    });
  }
});

module.exports = logger; 