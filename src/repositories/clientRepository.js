const prisma = require('../config/database');
const { createLogger } = require('../utils/logger');
const { NotFoundError, DatabaseError } = require('../errors/AppError');

const logger = createLogger({ module: 'repositories.client' });

class ClientRepository {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Encontrar cliente por ID con opciones de inclusión
   */
  async findById(id, options = {}) {
    const {
      includePromoter = false,
      includeVisits = false,
      includeCounts = false,
      visitLimit = 10,
    } = options;

    try {
      const include = {};
      
      if (includePromoter) {
        include.promoter = {
          select: {
            id: true,
            name: true,
            email: true,
          },
        };
      }
      
      if (includeVisits) {
        include.visits = {
          take: visitLimit,
          orderBy: {
            date: 'desc',
          },
          select: {
            id: true,
            date: true,
            notes: true,
            status: true,
            purpose: true,
          },
        };
      }
      
      if (includeCounts) {
        include._count = {
          select: {
            visits: true,
          },
        };
      }

      const client = await this.prisma.client.findUnique({
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined,
      });

      if (!client) {
        throw new NotFoundError('Cliente', id);
      }

      logger.debug('Client found by ID', { clientId: id });
      return client;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error finding client by ID', { 
        clientId: id, 
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar cliente', error);
    }
  }

  /**
   * Encontrar cliente por ID sin lanzar error si no existe
   */
  async findByIdOptional(id, options = {}) {
    try {
      const client = await this.findById(id, options);
      return client;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Buscar clientes con filtros y paginación
   */
  async findMany(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const skip = (page - 1) * limit;
    const take = limit;

    try {
      const where = this.buildWhereClause(filters);

      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            promoter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                visits: true,
              },
            },
          },
        }),
        this.prisma.client.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Clients found with filters', {
        count: clients.length,
        total,
        page,
        limit,
        filters,
      });

      return {
        clients,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error finding clients', {
        filters,
        pagination,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar clientes', error);
    }
  }

  /**
   * Crear nuevo cliente
   */
  async create(data, options = {}) {
    const { includePromoter = true } = options;

    try {
      const include = includePromoter ? {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } : undefined;

      const client = await this.prisma.client.create({
        data,
        include,
      });

      logger.business('create', 'client', client.id, {
        promoterId: client.promoterId,
        name: client.name,
      });

      return client;
    } catch (error) {
      logger.error('Error creating client', {
        data,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al crear cliente', error);
    }
  }

  /**
   * Actualizar cliente
   */
  async update(id, data, options = {}) {
    const { includePromoter = true } = options;

    try {
      const include = includePromoter ? {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } : undefined;

      const client = await this.prisma.client.update({
        where: { id },
        data,
        include,
      });

      logger.business('update', 'client', client.id, {
        promoterId: client.promoterId,
        name: client.name,
        updatedFields: Object.keys(data),
      });

      return client;
    } catch (error) {
      logger.error('Error updating client', {
        clientId: id,
        data,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Cliente', id);
      }
      
      throw new DatabaseError('Error al actualizar cliente', error);
    }
  }

  /**
   * Eliminar cliente (hard delete)
   */
  async delete(id) {
    try {
      await this.prisma.client.delete({
        where: { id },
      });

      logger.business('delete', 'client', id);

      return true;
    } catch (error) {
      logger.error('Error deleting client', {
        clientId: id,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Cliente', id);
      }
      
      throw new DatabaseError('Error al eliminar cliente', error);
    }
  }

  /**
   * Soft delete cliente (marcar como inactivo)
   */
  async softDelete(id) {
    try {
      const client = await this.prisma.client.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
        include: {
          promoter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.business('softDelete', 'client', client.id, {
        promoterId: client.promoterId,
        name: client.name,
      });

      return client;
    } catch (error) {
      logger.error('Error soft deleting client', {
        clientId: id,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Cliente', id);
      }
      
      throw new DatabaseError('Error al desactivar cliente', error);
    }
  }

  /**
   * Restaurar cliente (soft delete revertido)
   */
  async restore(id) {
    try {
      const client = await this.prisma.client.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          promoter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.business('restore', 'client', client.id, {
        promoterId: client.promoterId,
        name: client.name,
      });

      return client;
    } catch (error) {
      logger.error('Error restoring client', {
        clientId: id,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Cliente', id);
      }
      
      throw new DatabaseError('Error al restaurar cliente', error);
    }
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getStats(filters = {}) {
    try {
      const where = this.buildWhereClause(filters);

      const [
        totalClients,
        clientsByBusinessType,
        clientsWithVisits,
        clientsByCategory,
        activeClients,
      ] = await Promise.all([
        // Total de clientes
        this.prisma.client.count({ where }),
        
        // Clientes por tipo de negocio
        this.prisma.client.groupBy({
          by: ['businessType'],
          where,
          _count: true,
        }),
        
        // Clientes con visitas (últimos 30 días)
        this.prisma.client.count({
          where: {
            ...where,
            visits: {
              some: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        }),
        
        // Clientes por categoría
        this.prisma.client.groupBy({
          by: ['category'],
          where,
          _count: true,
        }),
        
        // Clientes activos
        this.prisma.client.count({
          where: {
            ...where,
            isActive: true,
          },
        }),
      ]);

      // Formatear estadísticas
      const stats = {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        clientsWithVisits,
        clientsWithoutVisits: totalClients - clientsWithVisits,
        clientsByBusinessType: clientsByBusinessType.reduce((acc, item) => {
          acc[item.businessType || 'Sin tipo'] = item._count;
          return acc;
        }, {}),
        clientsByCategory: clientsByCategory.reduce((acc, item) => {
          acc[item.category || 'Sin categoría'] = item._count;
          return acc;
        }, {}),
      };

      logger.debug('Client stats calculated', {
        filters,
        stats: {
          totalClients,
          activeClients,
          clientsWithVisits,
        },
      });

      return stats;
    } catch (error) {
      logger.error('Error getting client stats', {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al obtener estadísticas de clientes', error);
    }
  }

  /**
   * Contar clientes con filtros
   */
  async count(filters = {}) {
    try {
      const where = this.buildWhereClause(filters);
      const count = await this.prisma.client.count({ where });

      logger.debug('Client count calculated', { filters, count });
      return count;
    } catch (error) {
      logger.error('Error counting clients', {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al contar clientes', error);
    }
  }

  /**
   * Verificar si cliente existe
   */
  async exists(id) {
    try {
      const count = await this.prisma.client.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking if client exists', {
        clientId: id,
        error: error.message,
      });
      throw new DatabaseError('Error al verificar existencia de cliente', error);
    }
  }

  /**
   * Verificar si cliente pertenece a promotor
   */
  async belongsToPromoter(clientId, promoterId) {
    try {
      const count = await this.prisma.client.count({
        where: {
          id: clientId,
          promoterId,
        },
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking client belongs to promoter', {
        clientId,
        promoterId,
        error: error.message,
      });
      throw new DatabaseError('Error al verificar pertenencia de cliente', error);
    }
  }

  /**
   * Obtener clientes por promotor
   */
  async findByPromoter(promoterId, filters = {}, pagination = {}) {
    return this.findMany(
      { ...filters, promoterId },
      pagination
    );
  }

  /**
   * Obtener clientes por supervisores (clientes de sus promotores)
   */
  async findBySupervisor(supervisorId, filters = {}, pagination = {}) {
    try {
      // Obtener IDs de promotores del supervisor
      const promoters = await this.prisma.user.findMany({
        where: { supervisorId },
        select: { id: true },
      });

      const promoterIds = promoters.map(p => p.id);

      if (promoterIds.length === 0) {
        return {
          clients: [],
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      return this.findMany(
        { ...filters, promoterId: { in: promoterIds } },
        pagination
      );
    } catch (error) {
      logger.error('Error finding clients by supervisor', {
        supervisorId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar clientes por supervisor', error);
    }
  }

  /**
   * Construir cláusula WHERE para filtros
   */
  buildWhereClause(filters = {}) {
    const where = {};

    // Filtro por promotor
    if (filters.promoterId) {
      if (typeof filters.promoterId === 'object' && filters.promoterId.in) {
        where.promoterId = { in: filters.promoterId.in };
      } else {
        where.promoterId = filters.promoterId;
      }
    }

    // Filtro por tipo de negocio
    if (filters.businessType) {
      where.businessType = filters.businessType;
    }

    // Filtro por categoría
    if (filters.category) {
      where.category = filters.category;
    }

    // Filtro por estado activo
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Filtro por fecha de creación
    if (filters.createdAt) {
      if (filters.createdAt.gte) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.createdAt.gte) };
      }
      if (filters.createdAt.lte) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.createdAt.lte) };
      }
    }

    // Filtro de búsqueda
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtro por soft delete (solo clientes no eliminados por defecto)
    if (filters.includeDeleted !== true) {
      where.deletedAt = null;
    }

    return where;
  }

  /**
   * Ejecutar transacción
   */
  async transaction(callback) {
    try {
      return await this.prisma.$transaction(callback);
    } catch (error) {
      logger.error('Transaction failed', {
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error en transacción', error);
    }
  }
}

// Exportar instancia singleton
module.exports = new ClientRepository();