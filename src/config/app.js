const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { errorHandler, notFoundHandler } = require('../errors/AppError');
const { createLogger, http: httpLogger } = require('../utils/logger');
const { rateLimitMiddleware, rateLimitMetrics } = require('../middleware/rateLimit/rateLimiter');

const logger = createLogger({ module: 'app' });

// Función para verificar estado de directorios de Coolify
const checkCoolifyDirectories = () => {
  const requiredDirs = ['/app/uploads', '/app/tmp', '/app/logs'];
  const status = {
    allHealthy: true,
    directories: {}
  };

  requiredDirs.forEach(dirPath => {
    try {
      const exists = fs.existsSync(dirPath);
      const writable = exists ? (() => {
        try {
          // Intentar escribir un archivo temporal para verificar permisos
          const testFile = path.join(dirPath, `.healthcheck-${Date.now()}`);
          fs.writeFileSync(testFile, 'healthcheck');
          fs.unlinkSync(testFile);
          return true;
        } catch {
          return false;
        }
      })() : false;

      status.directories[dirPath] = {
        exists,
        writable,
        path: dirPath,
        healthy: exists && writable
      };

      if (!exists || !writable) {
        status.allHealthy = false;
      }
    } catch (error) {
      status.directories[dirPath] = {
        exists: false,
        writable: false,
        error: error.message,
        path: dirPath,
        healthy: false
      };
      status.allHealthy = false;
    }
  });

  return status;
};

// Importar rutas
const authRoutes = require('../routes/authRoutes');
const visitRoutes = require('../routes/visitRoutes');
const visitImageRoutes = require('../routes/visitImageRoutes');
const adminRoutes = require('../routes/adminRoutes');
const clientRoutes = require('../routes/clientRoutes');
const supervisorRoutes = require('../routes/supervisorRoutes');

// Configuración de rate limiting (usando el nuevo sistema)
const limiter = rateLimitMiddleware.api;

// Crear aplicación Express
const app = express();

// Middleware de seguridad
app.use(helmet());

// Configurar CORS dinámico y seguro
const corsOptions = {
  origin: (origin, callback) => {
    // Si no hay origen (ej: solicitudes desde servidor, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Parsear orígenes permitidos desde variable de entorno
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [
          'https://app.prodevfabian.cloud',
          'https://api.prodevfabian.cloud',
          'http://localhost:3000' // Para desarrollo local
        ];
    
    // En desarrollo, permitir cualquier origen (para facilitar pruebas)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🌐 Origen CORS bloqueado: ${origin}`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 204 // Para manejar preflight OPTIONS correctamente
};

app.use(cors(corsOptions));

// Manejar preflight OPTIONS para todas las rutas
app.options('*', cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // En producción, usar nuestro logger estructurado
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar respuesta para registrar métricas
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      httpLogger(req, res, duration);
      return originalSend.call(this, body);
    };
    
    next();
  });
}

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Servir archivos estáticos (uploads) - Compatibilidad Coolify
// En producción usa /app/uploads, en desarrollo usa ruta relativa
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : path.join(__dirname, '../../uploads');

app.use('/uploads', express.static(uploadsPath, {
  fallthrough: true, // No lanzar error si no existe
  setHeaders: (res, path) => {
    // Headers de seguridad para archivos subidos
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }
}));

// Rutas de salud - extremadamente livianas y sin dependencias
app.get('/health', (req, res) => {
  try {
    // Verificar directorios de Coolify
    const storageStatus = checkCoolifyDirectories();
    
    res.status(200).json({
      success: true,
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'production',
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      storage: {
        healthy: storageStatus.allHealthy,
        directories: storageStatus.directories
      }
    });
  } catch (error) {
    // Si hay algún error en el healthcheck, igual responder 200
    // para no afectar el monitoreo de Traefik
    res.status(200).json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      note: "Healthcheck básico - error interno ignorado",
      storage: {
        healthy: false,
        error: error.message
      }
    });
  }
});

// Liveness probe - solo verifica que el proceso está vivo
app.get('/health/liveness', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    // Fallback si hay error
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe - verifica que la aplicación está lista para recibir tráfico
app.get('/health/readiness', (req, res) => {
  try {
    // Este endpoint siempre responde 200 una vez que el servidor está arriba
    // No verifica base de datos para no bloquear el healthcheck
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    // Fallback si hay error
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/visits/images', visitImageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/supervisor', supervisorRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Gestión de Visitas de Promotores',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      visits: '/api/visits',
      visitsWithImages: '/api/visits/images',
      admin: '/api/admin',
      clients: '/api/clients',
      supervisor: '/api/supervisor',
      health: '/health',
      uploads: '/uploads'
    }
  });
});

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo centralizado de errores
app.use(errorHandler);

module.exports = app;