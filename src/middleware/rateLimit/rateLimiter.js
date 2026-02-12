const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { createLogger } = require('../../utils/logger');
const { RateLimitError } = require('../../errors/AppError');

const logger = createLogger({ module: 'rate-limit' });

// Configuración de Redis para rate limiting
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    const redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client', { error: error.message });
    return null;
  }
};

// Cliente Redis (opcional)
const redisClient = process.env.ENABLE_REDIS_RATE_LIMIT === 'true' 
  ? createRedisClient() 
  : null;

// Configuraciones de rate limiting por tipo de endpoint
const rateLimitConfigs = {
  // Rate limiting para autenticación (más restrictivo)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por IP
    message: 'Demasiados intentos de autenticación. Por favor, intente más tarde.',
    skipSuccessfulRequests: true, // No contar intentos exitosos
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar IP + ruta para rate limiting de autenticación
      return `auth:${req.ip}:${req.path}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for authentication', {
        ip: req.ip,
        path: req.path,
        user: req.user?.id,
      });
      
      const error = new RateLimitError('Demasiados intentos de autenticación. Por favor, intente más tarde.');
      res.status(error.statusCode).json(error.toJSON());
    },
  },
  
  // Rate limiting para API general (menos restrictivo)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por IP
    message: 'Demasiadas solicitudes. Por favor, intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar IP + ruta para rate limiting general
      return `api:${req.ip}:${req.path}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for API', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        user: req.user?.id,
      });
      
      const error = new RateLimitError('Demasiadas solicitudes. Por favor, intente más tarde.');
      res.status(error.statusCode).json(error.toJSON());
    },
  },
  
  // Rate limiting para endpoints de creación (más restrictivo)
  create: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // 50 creaciones por IP
    message: 'Demasiadas operaciones de creación. Por favor, intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar IP + ruta + método para rate limiting de creación
      return `create:${req.ip}:${req.path}:${req.method}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for create operations', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        user: req.user?.id,
      });
      
      const error = new RateLimitError('Demasiadas operaciones de creación. Por favor, intente más tarde.');
      res.status(error.statusCode).json(error.toJSON());
    },
  },
  
  // Rate limiting para usuarios autenticados (basado en user ID)
  user: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 1000, // 1000 solicitudes por usuario
    message: 'Demasiadas solicitudes para tu cuenta. Por favor, intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar user ID si está autenticado, de lo contrario usar IP
      return req.user 
        ? `user:${req.user.id}:${req.path}`
        : `user:${req.ip}:${req.path}`;
    },
    skip: (req) => {
      // Saltar rate limiting para usuarios admin
      return req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for user', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        user: req.user?.id,
        role: req.user?.role,
      });
      
      const error = new RateLimitError('Demasiadas solicitudes para tu cuenta. Por favor, intente más tarde.');
      res.status(error.statusCode).json(error.toJSON());
    },
  },
  
  // Rate limiting para endpoints públicos (muy restrictivo)
  public: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // 20 solicitudes por IP
    message: 'Demasiadas solicitudes desde tu dirección IP. Por favor, intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return `public:${req.ip}:${req.path}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for public endpoint', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      const error = new RateLimitError('Demasiadas solicitudes desde tu dirección IP. Por favor, intente más tarde.');
      res.status(error.statusCode).json(error.toJSON());
    },
  },
};

// Crear instancias de rate limiting
const createRateLimiter = (configName, customConfig = {}) => {
  const baseConfig = rateLimitConfigs[configName] || rateLimitConfigs.api;
  const config = { ...baseConfig, ...customConfig };
  
  // Agregar store de Redis si está disponible
  if (redisClient && process.env.ENABLE_REDIS_RATE_LIMIT === 'true') {
    config.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    });
    
    logger.info(`Using Redis store for rate limiting: ${configName}`);
  } else {
    logger.info(`Using in-memory store for rate limiting: ${configName}`);
  }
  
  return rateLimit(config);
};

// Middleware de rate limiting específico para rutas
const rateLimitMiddleware = {
  // Rate limiting para autenticación
  auth: createRateLimiter('auth'),
  
  // Rate limiting para API general
  api: createRateLimiter('api'),
  
  // Rate limiting para operaciones de creación
  create: createRateLimiter('create'),
  
  // Rate limiting por usuario
  user: createRateLimiter('user'),
  
  // Rate limiting para endpoints públicos
  public: createRateLimiter('public'),
  
  // Rate limiting personalizado
  custom: (config) => createRateLimiter('api', config),
  
  // Rate limiting por IP con configuración personalizada
  byIp: (windowMs = 15 * 60 * 1000, max = 100) => 
    createRateLimiter('api', { windowMs, max }),
  
  // Rate limiting por usuario con configuración personalizada
  byUser: (windowMs = 60 * 60 * 1000, max = 1000) => 
    createRateLimiter('user', { windowMs, max }),
  
  // Rate limiting para endpoints específicos
  forRoute: (route, config = {}) => {
    const routeConfig = {
      keyGenerator: (req) => {
        return `route:${req.ip}:${route}:${req.method}`;
      },
      ...config,
    };
    
    return createRateLimiter('api', routeConfig);
  },
};

// Middleware para registrar métricas de rate limiting
const rateLimitMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar respuesta para registrar métricas
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Registrar métricas si es una respuesta de rate limiting
    if (res.statusCode === 429) {
      logger.warn('Rate limit response sent', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        user: req.user?.id,
        duration,
        headers: res.getHeaders(),
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Función para obtener estadísticas de rate limiting
const getRateLimitStats = async () => {
  if (!redisClient) {
    return { usingRedis: false, message: 'Redis not configured for rate limiting' };
  }
  
  try {
    const keys = await redisClient.keys('rl:*');
    const stats = {
      totalKeys: keys.length,
      usingRedis: true,
      timestamp: new Date().toISOString(),
    };
    
    // Agrupar por tipo de rate limiting
    const groupedStats = {};
    keys.forEach(key => {
      const parts = key.split(':');
      const type = parts[1] || 'unknown';
      
      if (!groupedStats[type]) {
        groupedStats[type] = 0;
      }
      groupedStats[type]++;
    });
    
    stats.groupedByType = groupedStats;
    
    return stats;
  } catch (error) {
    logger.error('Failed to get rate limit stats', { error: error.message });
    return { usingRedis: true, error: error.message };
  }
};

// Middleware para health check de rate limiting
const rateLimitHealthCheck = async (req, res) => {
  try {
    const stats = await getRateLimitStats();
    
    res.status(200).json({
      success: true,
      data: {
        rateLimiting: {
          enabled: true,
          usingRedis: stats.usingRedis,
          configs: Object.keys(rateLimitConfigs),
          timestamp: new Date().toISOString(),
        },
        ...stats,
      },
    });
  } catch (error) {
    logger.error('Rate limit health check failed', { error: error.message });
    
    res.status(200).json({
      success: true,
      data: {
        rateLimiting: {
          enabled: true,
          usingRedis: false,
          configs: Object.keys(rateLimitConfigs),
          timestamp: new Date().toISOString(),
          warning: 'Redis not available, using in-memory store',
        },
      },
    });
  }
};

module.exports = {
  rateLimitMiddleware,
  rateLimitMetrics,
  getRateLimitStats,
  rateLimitHealthCheck,
  redisClient,
};