const pino = require('pino');
const path = require('path');

// Configuración del logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      node_version: process.version,
    }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

// Logger para desarrollo (más detallado)
const devLogger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      levelFirst: true,
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

// Logger para producción (más estructurado)
const prodLogger = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      node_version: process.version,
    }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer,
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

// Seleccionar logger según entorno
const getLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? prodLogger : devLogger;
};

// Logger principal
const mainLogger = getLogger();

// Métodos de logging con contexto
const createLoggerWithContext = (context = {}) => {
  const childLogger = mainLogger.child(context);
  
  return {
    trace: (msg, data = {}) => childLogger.trace(data, msg),
    debug: (msg, data = {}) => childLogger.debug(data, msg),
    info: (msg, data = {}) => childLogger.info(data, msg),
    warn: (msg, data = {}) => childLogger.warn(data, msg),
    error: (msg, data = {}) => childLogger.error(data, msg),
    fatal: (msg, data = {}) => childLogger.fatal(data, msg),
    
    // Métodos específicos para diferentes tipos de logs
    http: (req, res, responseTime) => {
      childLogger.info({
        req: {
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            referer: req.headers.referer,
          },
        },
        res: {
          statusCode: res.statusCode,
        },
        responseTime,
      }, 'HTTP request');
    },
    
    database: (operation, query, duration, success = true) => {
      childLogger.info({
        operation,
        query: typeof query === 'string' ? query : JSON.stringify(query),
        duration,
        success,
      }, 'Database operation');
    },
    
    business: (action, entity, id, data = {}) => {
      childLogger.info({
        action,
        entity,
        id,
        ...data,
      }, 'Business operation');
    },
    
    security: (event, user, ip, details = {}) => {
      childLogger.warn({
        event,
        user,
        ip,
        ...details,
      }, 'Security event');
    },
    
    performance: (operation, duration, threshold, details = {}) => {
      if (duration > threshold) {
        childLogger.warn({
          operation,
          duration,
          threshold,
          ...details,
        }, 'Performance warning');
      } else {
        childLogger.debug({
          operation,
          duration,
          ...details,
        }, 'Performance metric');
      }
    },
    
    // Método para crear un logger hijo con contexto adicional
    child: (additionalContext) => createLoggerWithContext({ ...context, ...additionalContext }),
  };
};

// Logger por defecto
const defaultLogger = createLoggerWithContext({ module: 'app' });

module.exports = {
  logger: mainLogger,
  createLogger: createLoggerWithContext,
  defaultLogger,
  
  // Métodos de conveniencia
  trace: (msg, data) => defaultLogger.trace(msg, data),
  debug: (msg, data) => defaultLogger.debug(msg, data),
  info: (msg, data) => defaultLogger.info(msg, data),
  warn: (msg, data) => defaultLogger.warn(msg, data),
  error: (msg, data) => defaultLogger.error(msg, data),
  fatal: (msg, data) => defaultLogger.fatal(msg, data),
  
  // Métodos específicos
  http: (req, res, responseTime) => defaultLogger.http(req, res, responseTime),
  database: (operation, query, duration, success) => defaultLogger.database(operation, query, duration, success),
  business: (action, entity, id, data) => defaultLogger.business(action, entity, id, data),
  security: (event, user, ip, details) => defaultLogger.security(event, user, ip, details),
  performance: (operation, duration, threshold, details) => defaultLogger.performance(operation, duration, threshold, details),
};