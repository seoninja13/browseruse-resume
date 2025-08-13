/**
 * Error Handling and Logging Module
 * 
 * Provides comprehensive error handling, retry mechanisms, and logging
 * for the LinkedIn Browser Automation system.
 * 
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Logger class for structured logging
 */
class Logger {
  constructor(module = 'System') {
    this.module = module;
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    this.log('INFO', message, data);
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    this.log('ERROR', message, errorData);
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  /**
   * Core logging function
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.module,
      message,
      data
    };

    // Console output
    const consoleMessage = `[${timestamp}] ${level} [${this.module}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage, data || '');
        break;
      case 'WARN':
        console.warn(consoleMessage, data || '');
        break;
      case 'DEBUG':
        console.debug(consoleMessage, data || '');
        break;
      default:
        console.log(consoleMessage, data || '');
    }

    // File logging
    this.writeToFile(logEntry);
  }

  /**
   * Write log entry to file
   */
  writeToFile(logEntry) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `automation-${date}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
}

/**
 * Error Handler class for managing automation errors
 */
class ErrorHandler {
  constructor() {
    this.logger = new Logger('ErrorHandler');
    this.errorCounts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Handle error with retry logic
   */
  async handleWithRetry(operation, context = {}, maxRetries = this.maxRetries) {
    const operationName = context.operation || 'Unknown Operation';
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Executing ${operationName} (attempt ${attempt}/${maxRetries})`);
        
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.info(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`❌ ${operationName} failed on attempt ${attempt}:`, error.message);
        
        // Track error frequency
        this.trackError(error, context);
        
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt, error);
          this.logger.info(`⏳ Retrying in ${delay}ms...`);
          await this.wait(delay);
        }
      }
    }

    // All retries failed
    this.logger.error(`💥 ${operationName} failed after ${maxRetries} attempts`, lastError);
    throw new AutomationError(`${operationName} failed after ${maxRetries} attempts`, lastError, context);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt, error) {
    let baseDelay = this.retryDelay;
    
    // Adjust delay based on error type
    if (error.name === 'TimeoutError') {
      baseDelay *= 2;
    } else if (error.name === 'NetworkError') {
      baseDelay *= 1.5;
    }
    
    // Exponential backoff
    return baseDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Track error frequency for analysis
   */
  trackError(error, context) {
    const errorKey = `${error.name}:${context.operation || 'unknown'}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    // Log frequent errors
    if (count > 5) {
      this.logger.warn(`⚠️ Frequent error detected: ${errorKey} (${count + 1} times)`);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {};
    for (const [key, count] of this.errorCounts.entries()) {
      stats[key] = count;
    }
    return stats;
  }

  /**
   * Wait utility
   */
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

/**
 * Custom error class for automation errors
 */
class AutomationError extends Error {
  constructor(message, originalError = null, context = {}) {
    super(message);
    this.name = 'AutomationError';
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }

  /**
   * Get detailed error information
   */
  getDetails() {
    return {
      message: this.message,
      name: this.name,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError ? {
        message: this.originalError.message,
        name: this.originalError.name,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Session Recovery Manager
 */
class SessionRecovery {
  constructor() {
    this.logger = new Logger('SessionRecovery');
    this.sessionBackupDir = path.join(__dirname, '..', '..', 'logs', 'sessions');
    this.ensureSessionDirectory();
  }

  /**
   * Ensure session backup directory exists
   */
  ensureSessionDirectory() {
    if (!fs.existsSync(this.sessionBackupDir)) {
      fs.mkdirSync(this.sessionBackupDir, { recursive: true });
    }
  }

  /**
   * Save session state for recovery
   */
  async saveSessionState(sessionData) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `session-${timestamp}.json`;
      const filepath = path.join(this.sessionBackupDir, filename);
      
      const sessionBackup = {
        timestamp: new Date().toISOString(),
        sessionData,
        version: '1.0.0'
      };
      
      fs.writeFileSync(filepath, JSON.stringify(sessionBackup, null, 2));
      this.logger.info(`Session state saved: ${filename}`);
      
      return { success: true, filename };
      
    } catch (error) {
      this.logger.error('Failed to save session state:', error);
      throw new AutomationError('Session save failed', error);
    }
  }

  /**
   * Restore session state
   */
  async restoreSessionState(filename = null) {
    try {
      let filepath;
      
      if (filename) {
        filepath = path.join(this.sessionBackupDir, filename);
      } else {
        // Find most recent session backup
        const files = fs.readdirSync(this.sessionBackupDir)
          .filter(f => f.startsWith('session-') && f.endsWith('.json'))
          .sort()
          .reverse();
        
        if (files.length === 0) {
          throw new Error('No session backups found');
        }
        
        filepath = path.join(this.sessionBackupDir, files[0]);
      }
      
      const sessionBackup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      this.logger.info(`Session state restored from: ${path.basename(filepath)}`);
      
      return sessionBackup.sessionData;
      
    } catch (error) {
      this.logger.error('Failed to restore session state:', error);
      throw new AutomationError('Session restore failed', error);
    }
  }

  /**
   * Clean old session backups
   */
  cleanOldSessions(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = fs.readdirSync(this.sessionBackupDir);
      const now = Date.now();
      let cleaned = 0;
      
      files.forEach(file => {
        const filepath = path.join(this.sessionBackupDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        this.logger.info(`Cleaned ${cleaned} old session backups`);
      }
      
    } catch (error) {
      this.logger.error('Failed to clean old sessions:', error);
    }
  }
}

/**
 * Rate Limiter for LinkedIn automation
 */
class RateLimiter {
  constructor() {
    this.logger = new Logger('RateLimiter');
    this.requests = [];
    this.maxRequestsPerMinute = 30;
    this.maxRequestsPerHour = 500;
  }

  /**
   * Check if request is allowed
   */
  async checkRateLimit() {
    const now = Date.now();
    
    // Clean old requests
    this.requests = this.requests.filter(time => now - time < 60 * 60 * 1000); // 1 hour
    
    // Check minute limit
    const recentRequests = this.requests.filter(time => now - time < 60 * 1000); // 1 minute
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      const waitTime = 60 * 1000 - (now - recentRequests[0]);
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await this.wait(waitTime);
    }
    
    // Check hour limit
    if (this.requests.length >= this.maxRequestsPerHour) {
      const waitTime = 60 * 60 * 1000 - (now - this.requests[0]);
      this.logger.warn(`Hourly rate limit reached, waiting ${waitTime}ms`);
      await this.wait(waitTime);
    }
    
    // Record this request
    this.requests.push(now);
  }

  /**
   * Wait utility
   */
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

module.exports = {
  Logger,
  ErrorHandler,
  AutomationError,
  SessionRecovery,
  RateLimiter
};
