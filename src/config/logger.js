/**
 * Configuración de logging estructurado para producción
 */

const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger estructurado para producción
 */
const logger = {
  /**
   * Log de información
   */
  info: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data,
      pid: process.pid
    };
    
    console.log(`[${logEntry.timestamp}] INFO: ${message}`, data);
    
    // Escribir en archivo
    try {
      const logPath = path.join(logsDir, 'app.log');
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error escribiendo en archivo de log:', error.message);
    }
  },

  /**
   * Log de advertencias
   */
  warn: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      data,
      pid: process.pid
    };
    
    console.warn(`[${logEntry.timestamp}] WARN: ${message}`, data);
    
    // Escribir en archivo
    try {
      const logPath = path.join(logsDir, 'app.log');
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error escribiendo en archivo de log:', error.message);
    }
  },

  /**
   * Log de errores
   */
  error: (message, error = null, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      data,
      pid: process.pid
    };
    
    console.error(`[${logEntry.timestamp}] ERROR: ${message}`, error, data);
    
    // Escribir en archivo de errores
    try {
      const errorLogPath = path.join(logsDir, 'errors.log');
      fs.appendFileSync(errorLogPath, JSON.stringify(logEntry) + '\n');
      
      // También escribir en app.log
      const appLogPath = path.join(logsDir, 'app.log');
      fs.appendFileSync(appLogPath, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
      console.error('Error escribiendo en archivo de log:', logError.message);
    }
  },

  /**
   * Log de inicio de servidor
   */
  serverStart: (port, environment, corsOrigins) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Servidor iniciado',
      data: {
        port,
        environment,
        corsOrigins,
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        }
      },
      pid: process.pid
    };
    
    console.log(`
🚀 ========================================
🚀 Servidor ejecutándose en puerto: ${port}
🚀 Entorno: ${environment}
🚀 PID: ${process.pid}
🚀 Node.js: ${process.version}
🚀 Orígenes CORS permitidos: ${corsOrigins}
🚀 Health check: http://0.0.0.0:${port}/health
🚀 ========================================
    `);
    
    // Escribir en archivo
    try {
      const logPath = path.join(logsDir, 'app.log');
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error escribiendo en archivo de log:', error.message);
    }
  },

  /**
   * Log de peticiones HTTP (para usar como middleware)
   */
  httpLogger: (req, res, next) => {
    const start = Date.now();
    
    // Capturar respuesta original
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'HTTP',
        message: 'Petición HTTP',
        data: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'unknown'
        },
        pid: process.pid
      };
      
      // Solo loggear en producción si no es healthcheck
      if (process.env.NODE_ENV === 'production' && !req.originalUrl.includes('/health')) {
        try {
          const logPath = path.join(logsDir, 'http.log');
          fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
        } catch (error) {
          console.error('Error escribiendo en archivo de log HTTP:', error.message);
        }
      }
      
      // Restaurar función original
      res.send = originalSend;
      return res.send(body);
    };
    
    next();
  }
};

module.exports = logger;