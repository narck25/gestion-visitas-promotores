const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://app.prodevfabian.cloud'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Simular middleware de autenticación (sin base de datos)
const mockAuthMiddleware = (req, res, next) => {
  // Simular un usuario autenticado para desarrollo
  req.user = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    name: 'Usuario Desarrollo',
    role: 'ADMIN'
  };
  next();
};

// Ruta de salud simple
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    note: "Modo desarrollo sin base de datos"
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Gestión de Visitas de Promotores (Modo Desarrollo Sin DB)',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      visits: '/api/visits',
      clients: '/api/clients'
    }
  });
});

// Ruta simple de visitas
app.post('/api/visits', mockAuthMiddleware, (req, res) => {
  console.log('POST /api/visits recibido:', req.body);
  
  // Simular respuesta exitosa
  const mockVisit = {
    id: `visit-${Date.now()}`,
    promoterId: req.user.id,
    clientId: req.body.clientId || 'mock-client-id',
    notes: req.body.notes || null,
    latitude: req.body.latitude ? Number(req.body.latitude) : null,
    longitude: req.body.longitude ? Number(req.body.longitude) : null,
    beforePhotos: req.body.beforePhotos || [],
    afterPhotos: req.body.afterPhotos || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Visita creada exitosamente (modo desarrollo)',
    data: { visit: mockVisit }
  });
});

// Ruta simple para obtener visitas
app.get('/api/visits', mockAuthMiddleware, (req, res) => {
  console.log('GET /api/visits recibido');
  
  // Simular lista de visitas
  const mockVisits = [
    {
      id: 'visit-1',
      promoterId: req.user.id,
      clientId: 'client-1',
      notes: 'Visita de prueba 1',
      latitude: 19.4326,
      longitude: -99.1332,
      beforePhotos: [],
      afterPhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'visit-2',
      promoterId: req.user.id,
      clientId: 'client-2',
      notes: 'Visita de prueba 2',
      latitude: 19.4327,
      longitude: -99.1333,
      beforePhotos: [],
      afterPhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    data: {
      visits: mockVisits,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  });
});

// Ruta simple para clientes
app.get('/api/clients', mockAuthMiddleware, (req, res) => {
  console.log('GET /api/clients recibido');
  
  // Simular lista de clientes
  const mockClients = [
    {
      id: 'client-1',
      name: 'Cliente de Prueba 1',
      phone: '555-123-4567',
      email: 'cliente1@example.com',
      address: 'Dirección de prueba 1',
      businessType: 'Restaurante'
    },
    {
      id: 'client-2',
      name: 'Cliente de Prueba 2',
      phone: '555-987-6543',
      email: 'cliente2@example.com',
      address: 'Dirección de prueba 2',
      businessType: 'Tienda'
    }
  ];
  
  res.status(200).json({
    success: true,
    data: { clients: mockClients }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
  console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Modo: Desarrollo sin base de datos`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 ========================================`);
});