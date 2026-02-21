/**
 * Módulo de permisos reutilizable para defensa en profundidad
 * 
 * Este módulo proporciona funciones de autorización que pueden ser usadas
 * directamente en los controllers como segunda capa de seguridad.
 * 
 * IMPORTANTE: No reemplaza los middlewares de ruta, los complementa.
 */

const prisma = require('../config/database');

/**
 * Errores de autorización estandarizados
 */
class AuthorizationError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Valida que el usuario tenga al menos uno de los roles requeridos
 * 
 * @param {Object} user - Objeto usuario de req.user
 * @param {Array<string>} requiredRoles - Roles permitidos
 * @throws {AuthorizationError} Si el usuario no tiene el rol requerido
 */
const requireRoles = (user, requiredRoles) => {
  if (!user) {
    throw new AuthorizationError('Usuario no autenticado', 401);
  }

  if (!requiredRoles.includes(user.role)) {
    throw new AuthorizationError('No tienes permisos para realizar esta acción', 403);
  }
};

/**
 * Valida que el usuario sea administrador (ADMIN o SUPER_ADMIN)
 * 
 * @param {Object} user - Objeto usuario de req.user
 * @throws {AuthorizationError} Si el usuario no es administrador
 */
const requireAdmin = (user) => {
  requireRoles(user, ['ADMIN', 'SUPER_ADMIN']);
};

/**
 * Valida que el usuario sea supervisor o superior
 * 
 * @param {Object} user - Objeto usuario de req.user
 * @throws {AuthorizationError} Si el usuario no es supervisor o superior
 */
const requireSupervisorOrAbove = (user) => {
  requireRoles(user, ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);
};

/**
 * Valida que el usuario sea promotor o superior
 * 
 * @param {Object} user - Objeto usuario de req.user
 * @throws {AuthorizationError} Si el usuario no es promotor o superior
 */
const requirePromoterOrAbove = (user) => {
  requireRoles(user, ['PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);
};

/**
 * Valida propiedad de un recurso (cliente, visita, etc.)
 * 
 * @param {Object} user - Objeto usuario de req.user
 * @param {string} resourceId - ID del recurso a validar
 * @param {string} resourceType - Tipo de recurso ('client', 'visit', 'user')
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<boolean>} true si tiene acceso, false si no
 * @throws {AuthorizationError} Si no tiene acceso
 */
const validateResourceOwnership = async (user, resourceId, resourceType, options = {}) => {
  if (!user) {
    throw new AuthorizationError('Usuario no autenticado', 401);
  }

  // ADMIN y SUPER_ADMIN tienen acceso a todo
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return true;
  }

  try {
    switch (resourceType) {
      case 'client': {
        const client = await prisma.client.findUnique({
          where: { id: resourceId },
          select: {
            promoterId: true,
            promoter: {
              select: {
                supervisorId: true
              }
            }
          }
        });

        if (!client) {
          throw new AuthorizationError('Recurso no encontrado', 404);
        }

        // PROMOTER: Solo sus propios clientes
        if (user.role === 'PROMOTER') {
          if (client.promoterId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        // SUPERVISOR: Clientes de sus promotores
        if (user.role === 'SUPERVISOR') {
          if (!client.promoter || client.promoter.supervisorId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        // VIEWER: Solo lectura de clientes de sus promotores
        if (user.role === 'VIEWER') {
          if (!client.promoter || client.promoter.supervisorId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        break;
      }

      case 'visit': {
        const visit = await prisma.visit.findUnique({
          where: { id: resourceId },
          select: {
            promoterId: true,
            promoter: {
              select: {
                supervisorId: true
              }
            }
          }
        });

        if (!visit) {
          throw new AuthorizationError('Recurso no encontrado', 404);
        }

        // PROMOTER: Solo sus propias visitas
        if (user.role === 'PROMOTER') {
          if (visit.promoterId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        // SUPERVISOR: Visitas de sus promotores
        if (user.role === 'SUPERVISOR') {
          if (!visit.promoter || visit.promoter.supervisorId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        // VIEWER: Solo lectura de visitas de sus promotores
        if (user.role === 'VIEWER') {
          if (!visit.promoter || visit.promoter.supervisorId !== user.id) {
            throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
          }
          return true;
        }

        break;
      }

      case 'user': {
        // Para recursos de usuario, validamos según reglas específicas
        const targetUser = await prisma.user.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            role: true,
            supervisorId: true
          }
        });

        if (!targetUser) {
          throw new AuthorizationError('Usuario no encontrado', 404);
        }

        // Un usuario siempre puede acceder a su propio perfil
        if (targetUser.id === user.id) {
          return true;
        }

        // ADMIN y SUPER_ADMIN pueden acceder a cualquier usuario
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          return true;
        }

        // SUPERVISOR puede acceder a sus promotores
        if (user.role === 'SUPERVISOR' && targetUser.role === 'PROMOTER' && targetUser.supervisorId === user.id) {
          return true;
        }

        throw new AuthorizationError('No tienes permisos para acceder a este recurso', 403);
      }

      default:
        throw new AuthorizationError('Tipo de recurso no soportado', 400);
    }
  } catch (error) {
    // Si ya es un AuthorizationError, lo relanzamos
    if (error instanceof AuthorizationError) {
      throw error;
    }
    // Para otros errores, lanzamos un error genérico
    throw new AuthorizationError('Error validando permisos del recurso', 500);
  }

  return false;
};

/**
 * Middleware wrapper para manejar errores de autorización
 * 
 * @param {Function} fn - Función que puede lanzar AuthorizationError
 * @returns {Function} Middleware que maneja errores de autorización
 */
const withAuthorization = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  };
};

/**
 * Helper para validar permisos en controllers
 * 
 * @param {Object} req - Request object
 * @param {Array<string>} requiredRoles - Roles requeridos
 * @param {Object} options - Opciones adicionales
 */
const validatePermissions = (req, requiredRoles, options = {}) => {
  const { user } = req;
  
  if (!user) {
    throw new AuthorizationError('Usuario no autenticado', 401);
  }

  if (!requiredRoles.includes(user.role)) {
    throw new AuthorizationError('No tienes permisos para realizar esta acción', 403);
  }

  // Validación adicional de propiedad si se especifica
  if (options.resourceId && options.resourceType) {
    // Esta validación se debe hacer de forma asíncrona
    // Por eso esta función solo valida roles
    // Para validación de recursos usar validateResourceOwnership directamente
  }
};

module.exports = {
  AuthorizationError,
  requireRoles,
  requireAdmin,
  requireSupervisorOrAbove,
  requirePromoterOrAbove,
  validateResourceOwnership,
  withAuthorization,
  validatePermissions
};