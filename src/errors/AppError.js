const { createLogger } = require('../utils/logger');
const logger = createLogger({ module: 'errors' });

/**
 * Clase base para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code || this.getErrorCode();
    this.timestamp = new Date().toISOString();
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Loggear error
    this.logError();
  }
  
  /**
   * Obtener código de error basado en el status code
   */
  getErrorCode() {
    if (this.statusCode >= 400 && this.statusCode < 500) {
      return 'CLIENT_ERROR';
    } else if (this.statusCode >= 500) {
      return 'SERVER_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
  
  /**
   * Loggear error según su tipo
   */
  logError() {
    const logData = {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      stack: this.stack,
    };
    
    if (this.statusCode >= 500) {
      logger.error('Server error occurred', logData);
    } else if (this.statusCode >= 400) {
      logger.warn('Client error occurred', logData);
    } else {
      logger.info('Application error occurred', logData);
    }
  }
  
  /**
   * Convertir error a formato JSON para respuesta
   */
  toJSON() {
    const json = {
      success: false,
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        timestamp: this.timestamp,
      },
    };
    
    // Solo incluir stack en desarrollo
    if (process.env.NODE_ENV === 'development') {
      json.error.stack = this.stack;
    }
    
    return json;
  }
}

/**
 * Error de validación (400)
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
  }
  
  toJSON() {
    const json = super.toJSON();
    json.error.errors = this.errors;
    return json;
  }
}

/**
 * Error de autenticación (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Error de autorización (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Error de recurso no encontrado (404)
 */
class NotFoundError extends AppError {
  constructor(resource, id) {
    const message = id 
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`;
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.resource = resource;
    this.id = id;
  }
}

/**
 * Error de conflicto (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Conflicto de recursos') {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

/**
 * Error de límite de tasa (429)
 */
class RateLimitError extends AppError {
  constructor(message = 'Límite de tasa excedido') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Error de base de datos (500)
 */
class DatabaseError extends AppError {
  constructor(message = 'Error de base de datos', originalError = null) {
    super(message, 500, false, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Error de servicio externo (502)
 */
class ExternalServiceError extends AppError {
  constructor(service, message = 'Error en servicio externo') {
    super(`${service}: ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error de timeout (504)
 */
class TimeoutError extends AppError {
  constructor(operation, timeout) {
    super(`Timeout en operación: ${operation} (${timeout}ms)`, 504, true, 'TIMEOUT_ERROR');
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * Middleware para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Si el error ya es una instancia de AppError, usarlo directamente
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  
  // Si es un error de validación de express-validator
  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    const validationError = new ValidationError(
      'Error de validación',
      err.errors || err.array ? err.array() : []
    );
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }
  
  // Si es un error de JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const authError = new AuthenticationError('Token inválido o expirado');
    return res.status(authError.statusCode).json(authError.toJSON());
  }
  
  // Si es un error de Prisma
  if (err.name && err.name.includes('Prisma')) {
    const dbError = handlePrismaError(err);
    return res.status(dbError.statusCode).json(dbError.toJSON());
  }
  
  // Error no manejado - crear un error genérico
  const unhandledError = new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    500,
    false,
    'UNHANDLED_ERROR'
  );
  
  // Loggear error no manejado
  logger.error('Unhandled error', {
    error: err,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user,
    },
  });
  
  return res.status(unhandledError.statusCode).json(unhandledError.toJSON());
};

/**
 * Manejar errores específicos de Prisma
 */
const handlePrismaError = (err) => {
  // Error de validación de Prisma
  if (err.code === 'P2002') {
    return new ConflictError('Registro duplicado');
  }
  
  // Error de foreign key constraint
  if (err.code === 'P2003') {
    return new ValidationError('Violación de restricción de clave foránea');
  }
  
  // Recurso no encontrado
  if (err.code === 'P2025') {
    return new NotFoundError('Recurso', err.meta?.target || 'desconocido');
  }
  
  // Error de conexión a base de datos
  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1003') {
    return new DatabaseError('Error de conexión a base de datos', err);
  }
  
  // Error de timeout de base de datos
  if (err.code === 'P1008' || err.code === 'P1014') {
    return new TimeoutError('Operación de base de datos', 5000);
  }
  
  // Error genérico de base de datos
  return new DatabaseError('Error de base de datos', err);
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Ruta', req.originalUrl);
  res.status(error.statusCode).json(error.toJSON());
};

/**
 * Función de utilidad para envolver funciones async/await
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  TimeoutError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handlePrismaError,
};