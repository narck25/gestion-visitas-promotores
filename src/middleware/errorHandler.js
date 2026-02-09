/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  // Loggear el error con timestamp
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors,
      timestamp
    });
  }

  // Errores de Prisma
  if (err.code && err.code.startsWith('P')) {
    // Error de duplicado único
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'campo';
      return res.status(409).json({
        success: false,
        message: `El ${field} ya está en uso`,
        timestamp
      });
    }

    // Registro no encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado',
        timestamp
      });
    }

    // Error de constraint
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Error de referencia en la base de datos',
        timestamp
      });
    }
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      timestamp
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      timestamp
    });
  }

  // Error personalizado con status code
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp
    });
  }

  // Error por defecto
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor',
    timestamp,
    requestId: req.id || 'unknown'
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};