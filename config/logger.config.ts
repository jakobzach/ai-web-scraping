import winston from 'winston';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logLevel = 'info';
const logToConsole = true; // Always log to console for development
const logToFile = true; // Always log to files for persistence

// Custom format for log messages
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Add console transport if enabled
if (logToConsole) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel
    })
  );
}

// Add file transports if enabled
if (logToFile) {
  // General application log
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'app.log'),
      format: logFormat,
      level: logLevel,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );

  // Error-specific log
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'errors.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );

  // Scraping-specific log
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'scraping.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create specialized loggers for different components
export const scrapingLogger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'scraping.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    }),
    ...(logToConsole ? [new winston.transports.Console({ format: consoleFormat })] : [])
  ]
});

export const errorLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'errors.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    }),
    ...(logToConsole ? [new winston.transports.Console({ format: consoleFormat })] : [])
  ]
});

// Export default logger
export default logger; 