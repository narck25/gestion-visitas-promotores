const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
require('dotenv').config();

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

// Configurar CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
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