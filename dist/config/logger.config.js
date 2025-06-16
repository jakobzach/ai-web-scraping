import winston from 'winston';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const logLevel = 'info';
const logToConsole = true;
const logToFile = true;
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
}));
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
}));
const transports = [];
if (logToConsole) {
    transports.push(new winston.transports.Console({
        format: consoleFormat,
        level: logLevel
    }));
}
if (logToFile) {
    transports.push(new winston.transports.File({
        filename: path.join('logs', 'app.log'),
        format: logFormat,
        level: logLevel,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
    }));
    transports.push(new winston.transports.File({
        filename: path.join('logs', 'errors.log'),
        format: logFormat,
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
    }));
    transports.push(new winston.transports.File({
        filename: path.join('logs', 'scraping.log'),
        format: logFormat,
        level: 'info',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10
    }));
}
export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false
});
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
export default logger;
//# sourceMappingURL=logger.config.js.map