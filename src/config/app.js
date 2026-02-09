const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const logger = require('./logger');

// Importar rutas
const authRoutes = require('../routes/authRoutes');
const visitRoutes = require('../routes/visitRoutes');
const visitImageRoutes = require('../routes/visitImageRoutes');

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

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

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // En producción, usar nuestro logger estructurado
  app.use(logger.httpLogger);
}

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas de salud - extremadamente livianas y sin dependencias
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'production',
      memory: process.memoryUsage(),
      nodeVersion: process.version
    });
  } catch (error) {
    // Si hay algún error en el healthcheck, igual responder 200
    // para no afectar el monitoreo de Traefik
    res.status(200).json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      note: "Healthcheck básico - error interno ignorado"
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