const clientRepository = require('../repositories/clientRepository');
const userRepository = require('../repositories/userRepository');
const { createLogger } = require('../utils/logger');
const { 
  NotFoundError, 
  AuthorizationError, 
  ValidationError,
  ConflictError,
} = require('../errors/AppError');

const logger = createLogger({ module: 'services.client' });

class ClientService {
  constructor() {
    this.clientRepository = clientRepository;
    this.userRepository = userRepository;
  }

  /**
   * Obtener todos los clientes con filtros por rol
   */
  async getAllClients(user, filters = {}, pagination = {}) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Getting all clients', { userId, userRole, filters });

    // Construir filtros según el rol del usuario
    const roleFilters = this.buildRoleFilters(user, filters.promoterId);
    
    // Combinar filtros
    const combinedFilters = {
      ...roleFilters,
      ...filters,
    };

    // Validar que el usuario tenga permisos para filtrar por el promotor especificado
    if (filters.promoterId && !this.canFilterByPromoter(user, filters.promoterId)) {
      throw new AuthorizationError('No tienes permisos para filtrar por este promotor');
    }

    // Obtener clientes según el rol
    let result;
    if (userRole === 'SUPERVISOR') {
      result = await this.clientRepository.findBySupervisor(userId, combinedFilters, pagination);
    } else {
      result = await this.clientRepository.findMany(combinedFilters, pagination);
    }

    logger.info('Clients retrieved successfully', {
      userId,
      userRole,
      count: result.clients.length,
      total: result.pagination.total,
    });

    return result;
  }

  /**
   * Obtener cliente por ID con validación de permisos
   */
  async getClientById(id, user) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Getting client by ID', { clientId: id, userId, userRole });

    // Obtener cliente
    const client = await this.clientRepository.findById(id, {
      includePromoter: true,
      includeVisits: true,
      includeCounts: true,
    });

    // Validar permisos
    this.validateClientAccess(client, user);

    logger.info('Client retrieved successfully', {
      clientId: id,
      userId,
      userRole,
    });

    return client;
  }

  /**
   * Crear nuevo cliente con validación de permisos
   */
  async createClient(data, user) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Creating client', { userId, userRole, data: { ...data, promoterId: data.promoterId || 'self' } });

    // Determinar promoterId para el cliente
    const promoterId = await this.determinePromoterId(data.promoterId, user);

    // Validar que el promotor existe y tiene rol PROMOTER
    await this.validatePromoter(promoterId, user);

    // Preparar datos del cliente
    const clientData = {
      ...data,
      promoterId,
      isActive: true,
    };

    // Crear cliente
    const client = await this.clientRepository.create(clientData, {
      includePromoter: true,
    });

    logger.business('create', 'client', client.id, {
      userId,
      userRole,
      promoterId: client.promoterId,
      name: client.name,
    });

    return client;
  }

  /**
   * Actualizar cliente con validación de permisos
   */
  async updateClient(id, data, user) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Updating client', { clientId: id, userId, userRole, data });

    // Obtener cliente existente
    const existingClient = await this.clientRepository.findById(id);

    // Validar permisos para actualizar
    this.validateClientAccess(existingClient, user);

    // Si se está cambiando el promotor, validar permisos
    if (data.promoterId && data.promoterId !== existingClient.promoterId) {
      await this.validatePromoterChange(data.promoterId, user);
    }

    // Actualizar cliente
    const updatedClient = await this.clientRepository.update(id, data, {
      includePromoter: true,
    });

    logger.business('update', 'client', id, {
      userId,
      userRole,
      promoterId: updatedClient.promoterId,
      name: updatedClient.name,
      updatedFields: Object.keys(data),
    });

    return updatedClient;
  }

  /**
   * Eliminar cliente (soft delete) con validación de permisos
   */
  async deleteClient(id, user, hardDelete = false) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Deleting client', { clientId: id, userId, userRole, hardDelete });

    // Obtener cliente existente
    const existingClient = await this.clientRepository.findById(id);

    // Validar permisos para eliminar
    this.validateClientAccess(existingClient, user);

    let result;
    if (hardDelete) {
      // Hard delete (eliminación permanente)
      result = await this.clientRepository.delete(id);
    } else {
      // Soft delete (marcar como inactivo)
      result = await this.clientRepository.softDelete(id);
    }

    logger.business(hardDelete ? 'hardDelete' : 'softDelete', 'client', id, {
      userId,
      userRole,
      promoterId: existingClient.promoterId,
      name: existingClient.name,
    });

    return result;
  }

  /**
   * Restaurar cliente (soft delete revertido) con validación de permisos
   */
  async restoreClient(id, user) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Restoring client', { clientId: id, userId, userRole });

    // Obtener cliente existente (incluyendo eliminados)
    const existingClient = await this.clientRepository.findById(id);

    // Validar permisos para restaurar
    this.validateClientAccess(existingClient, user);

    // Restaurar cliente
    const restoredClient = await this.clientRepository.restore(id);

    logger.business('restore', 'client', id, {
      userId,
      userRole,
      promoterId: restoredClient.promoterId,
      name: restoredClient.name,
    });

    return restoredClient;
  }

  /**
   * Obtener estadísticas de clientes con validación de permisos
   */
  async getClientStats(user, filters = {}) {
    const { id: userId, role: userRole } = user;
    
    logger.debug('Getting client stats', { userId, userRole, filters });

    // Construir filtros según el rol del usuario
    const roleFilters = this.buildRoleFilters(user, filters.promoterId);
    
    // Combinar filtros
    const combinedFilters = {
      ...roleFilters,
      ...filters,
    };

    // Validar que el usuario tenga permisos para filtrar por el promotor especificado
    if (filters.promoterId && !this.canFilterByPromoter(user, filters.promoterId)) {
      throw new AuthorizationError('No tienes permisos para filtrar por este promotor');
    }

    // Obtener estadísticas
    const stats = await this.clientRepository.getStats(combinedFilters);

    logger.info('Client stats retrieved successfully', {
      userId,
      userRole,
      stats: {
        totalClients: stats.totalClients,
        activeClients: stats.activeClients,
        clientsWithVisits: stats.clientsWithVisits,
      },
    });

    return stats;
  }

  /**
   * Validar acceso a cliente según rol
   */
  validateClientAccess(client, user) {
    const { id: userId, role: userRole } = user;

    switch (userRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        // Los administradores pueden acceder a cualquier cliente
        return true;

      case 'SUPERVISOR':
        // Los supervisores solo pueden acceder a clientes de sus promotores
        if (!this.isClientUnderSupervisor(client, userId)) {
          throw new AuthorizationError('No tienes permisos para acceder a este cliente');
        }
        return true;

      case 'PROMOTER':
      case 'VIEWER':
        // Los promotores y viewers solo pueden acceder a sus propios clientes
        if (client.promoterId !== userId) {
          throw new AuthorizationError('No tienes permisos para acceder a este cliente');
        }
        return true;

      default:
        throw new AuthorizationError('Rol no autorizado para acceder a clientes');
    }
  }

  /**
   * Determinar promoterId para nuevo cliente
   */
  async determinePromoterId(requestedPromoterId, user) {
    const { id: userId, role: userRole } = user;

    // Si no se especifica promoterId, usar el ID del usuario
    if (!requestedPromoterId) {
      return userId;
    }

    // Validar permisos para asignar a otro promotor
    if (!this.canAssignToPromoter(user, requestedPromoterId)) {
      throw new AuthorizationError('No tienes permisos para asignar clientes a este promotor');
    }

    return requestedPromoterId;
  }

  /**
   * Validar que el promotor existe y tiene rol PROMOTER
   */
  async validatePromoter(promoterId, user) {
    try {
      const promoter = await this.userRepository.findById(promoterId, {
        includeRole: true,
      });

      if (promoter.role !== 'PROMOTER') {
        throw new ValidationError('El usuario asignado debe tener rol PROMOTER');
      }

      // Si el usuario es SUPERVISOR, validar que el promotor pertenezca a él
      if (user.role === 'SUPERVISOR' && promoter.supervisorId !== user.id) {
        throw new AuthorizationError('No tienes permisos para asignar clientes a este promotor');
      }

      return promoter;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Promotor', promoterId);
      }
      throw error;
    }
  }

  /**
   * Validar cambio de promotor
   */
  async validatePromoterChange(newPromoterId, user) {
    const { role: userRole } = user;

    // Solo ADMIN, SUPER_ADMIN y SUPERVISOR pueden cambiar el promotor
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(userRole)) {
      throw new AuthorizationError('No tienes permisos para cambiar el promotor del cliente');
    }

    // Validar que el nuevo promotor existe y tiene rol PROMOTER
    await this.validatePromoter(newPromoterId, user);

    return true;
  }

  /**
   * Construir filtros según el rol del usuario
   */
  buildRoleFilters(user, filterPromoterId) {
    const { id: userId, role: userRole } = user;
    const filters = {};

    switch (userRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        // Pueden filtrar por cualquier promotor o ver todos
        if (filterPromoterId) {
          filters.promoterId = filterPromoterId;
        }
        break;

      case 'SUPERVISOR':
        // Solo pueden ver clientes de sus promotores
        // El filtro específico se aplica en findBySupervisor
        break;

      case 'PROMOTER':
      case 'VIEWER':
        // Solo pueden ver sus propios clientes
        filters.promoterId = userId;
        break;

      default:
        // Por defecto, solo sus propios clientes
        filters.promoterId = userId;
    }

    return filters;
  }

  /**
   * Verificar si el usuario puede filtrar por un promotor específico
   */
  canFilterByPromoter(user, promoterId) {
    const { id: userId, role: userRole } = user;

    switch (userRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return true;

      case 'SUPERVISOR':
        // Los supervisores solo pueden filtrar por sus promotores
        return this.isPromoterUnderSupervisor(promoterId, userId);

      case 'PROMOTER':
      case 'VIEWER':
        // Los promotores y viewers solo pueden filtrar por sí mismos
        return promoterId === userId;

      default:
        return false;
    }
  }

  /**
   * Verificar si el usuario puede asignar clientes a un promotor
   */
  canAssignToPromoter(user, promoterId) {
    const { id: userId, role: userRole } = user;

    switch (userRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return true;

      case 'SUPERVISOR':
        // Los supervisores solo pueden asignar a sus promotores
        return this.isPromoterUnderSupervisor(promoterId, userId);

      case 'PROMOTER':
        // Los promotores no pueden asignar a otros promotores
        return false;

      default:
        return false;
    }
  }

  /**
   * Verificar si un promotor pertenece a un supervisor
   */
  async isPromoterUnderSupervisor(promoterId, supervisorId) {
    try {
      const promoter = await this.userRepository.findById(promoterId);
      return promoter.supervisorId === supervisorId;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Verificar si un cliente pertenece a un supervisor (a través de su promotor)
   */
  async isClientUnderSupervisor(client, supervisorId) {
    try {
      const promoter = await this.userRepository.findById(client.promoterId);
      return promoter.supervisorId === supervisorId;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Verificar si el cliente existe
   */
  async clientExists(id) {
    return this.clientRepository.exists(id);
  }

  /**
   * Verificar si el cliente pertenece al usuario
   */
  async clientBelongsToUser(id, user) {
    const { id: userId, role: userRole } = user;

    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return true;
    }

    if (userRole === 'SUPERVISOR') {
      const client = await this.clientRepository.findById(id);
      return this.isClientUnderSupervisor(client, userId);
    }

    return this.clientRepository.belongsToPromoter(id, userId);
  }

  /**
   * Obtener clientes por promotor (con validación de permisos)
   */
  async getClientsByPromoter(promoterId, user, filters = {}, pagination = {}) {
    // Validar que el usuario tenga permisos para ver clientes de este promotor
    if (!this.canFilterByPromoter(user, promoterId)) {
      throw new AuthorizationError('No tienes permisos para ver clientes de este promotor');
    }

    return this.clientRepository.findByPromoter(promoterId, filters, pagination);
  }

  /**
   * Obtener clientes por supervisor (con validación de permisos)
   */
  async getClientsBySupervisor(supervisorId, user, filters = {}, pagination = {}) {
    // Validar que el usuario tenga permisos para ver clientes de este supervisor
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.id !== supervisorId) {
      throw new AuthorizationError('No tienes permisos para ver clientes de este supervisor');
    }

    return this.clientRepository.findBySupervisor(supervisorId, filters, pagination);
  }

  /**
   * Ejecutar operación en transacción
   */
  async transaction(callback) {
    return this.clientRepository.transaction(callback);
  }
}

// Exportar instancia singleton
module.exports = new ClientService();