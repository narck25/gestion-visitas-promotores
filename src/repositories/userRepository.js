const prisma = require('../config/database');
const { createLogger } = require('../utils/logger');
const { NotFoundError, DatabaseError } = require('../errors/AppError');

const logger = createLogger({ module: 'repositories.user' });

class UserRepository {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Encontrar usuario por ID con opciones de inclusión
   */
  async findById(id, options = {}) {
    const {
      includeRole = false,
      includeSupervisor = false,
      includePromoters = false,
      includeClients = false,
      includeVisits = false,
    } = options;

    try {
      const include = {};
      
      if (includeSupervisor) {
        include.supervisor = {
          select: {
            id: true,
            name: true,
            email: true,
          },
        };
      }
      
      if (includePromoters) {
        include.promoters = {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        };
      }
      
      if (includeClients) {
        include.clients = {
          select: {
            id: true,
            name: true,
            businessName: true,
            businessType: true,
          },
        };
      }
      
      if (includeVisits) {
        include.visits = {
          select: {
            id: true,
            date: true,
            status: true,
            purpose: true,
          },
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined,
      });

      if (!user) {
        throw new NotFoundError('Usuario', id);
      }

      logger.debug('User found by ID', { userId: id });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error finding user by ID', { 
        userId: id, 
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar usuario', error);
    }
  }

  /**
   * Encontrar usuario por email
   */
  async findByEmail(email, options = {}) {
    const { includeRole = false } = options;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: includeRole ? {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        } : undefined,
      });

      if (!user) {
        throw new NotFoundError('Usuario', email);
      }

      logger.debug('User found by email', { email });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error finding user by email', { 
        email, 
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar usuario por email', error);
    }
  }

  /**
   * Buscar usuarios con filtros y paginación
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

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortBy]: sortOrder,
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            supervisorId: true,
            createdAt: true,
            updatedAt: true,
            supervisor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                promoters: true,
                clients: true,
                visits: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Users found with filters', {
        count: users.length,
        total,
        page,
        limit,
        filters,
      });

      return {
        users,
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
      logger.error('Error finding users', {
        filters,
        pagination,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al buscar usuarios', error);
    }
  }

  /**
   * Crear nuevo usuario
   */
  async create(data, options = {}) {
    const { includeSupervisor = false } = options;

    try {
      const include = includeSupervisor ? {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } : undefined;

      const user = await this.prisma.user.create({
        data,
        include,
      });

      logger.business('create', 'user', user.id, {
        email: user.email,
        role: user.role,
        supervisorId: user.supervisorId,
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', {
        data: { ...data, password: '[REDACTED]' },
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al crear usuario', error);
    }
  }

  /**
   * Actualizar usuario
   */
  async update(id, data, options = {}) {
    const { includeSupervisor = false } = options;

    try {
      const include = includeSupervisor ? {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } : undefined;

      const user = await this.prisma.user.update({
        where: { id },
        data,
        include,
      });

      logger.business('update', 'user', user.id, {
        email: user.email,
        role: user.role,
        updatedFields: Object.keys(data),
      });

      return user;
    } catch (error) {
      logger.error('Error updating user', {
        userId: id,
        data,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Usuario', id);
      }
      
      throw new DatabaseError('Error al actualizar usuario', error);
    }
  }

  /**
   * Eliminar usuario (hard delete)
   */
  async delete(id) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      logger.business('delete', 'user', id);

      return true;
    } catch (error) {
      logger.error('Error deleting user', {
        userId: id,
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundError('Usuario', id);
      }
      
      throw new DatabaseError('Error al eliminar usuario', error);
    }
  }

  /**
   * Obtener promotores por supervisor
   */
  async getPromotersBySupervisor(supervisorId, filters = {}, pagination = {}) {
    try {
      const where = {
        supervisorId,
        role: 'PROMOTER',
        ...this.buildWhereClause(filters),
      };

      const [promoters, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          orderBy: {
            [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                clients: true,
                visits: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      logger.debug('Promoters found by supervisor', {
        supervisorId,
        count: promoters.length,
        total,
      });

      return {
        promoters,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting promoters by supervisor', {
        supervisorId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al obtener promotores por supervisor', error);
    }
  }

  /**
   * Obtener supervisores
   */
  async getSupervisors(filters = {}, pagination = {}) {
    try {
      const where = {
        role: 'SUPERVISOR',
        ...this.buildWhereClause(filters),
      };

      const [supervisors, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          orderBy: {
            [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                promoters: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      logger.debug('Supervisors found', {
        count: supervisors.length,
        total,
      });

      return {
        supervisors,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting supervisors', {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al obtener supervisores', error);
    }
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(role, filters = {}, pagination = {}) {
    try {
      const where = {
        role,
        ...this.buildWhereClause(filters),
      };

      return this.findMany(where, pagination);
    } catch (error) {
      logger.error('Error getting users by role', {
        role,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al obtener usuarios por rol', error);
    }
  }

  /**
   * Verificar si usuario existe
   */
  async exists(id) {
    try {
      const count = await this.prisma.user.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking if user exists', {
        userId: id,
        error: error.message,
      });
      throw new DatabaseError('Error al verificar existencia de usuario', error);
    }
  }

  /**
   * Verificar si usuario tiene rol específico
   */
  async hasRole(id, role) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundError('Usuario', id);
      }

      return user.role === role;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error checking user role', {
        userId: id,
        role,
        error: error.message,
      });
      throw new DatabaseError('Error al verificar rol de usuario', error);
    }
  }

  /**
   * Verificar si usuario es supervisor de otro usuario
   */
  async isSupervisorOf(supervisorId, userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { supervisorId: true },
      });

      if (!user) {
        throw new NotFoundError('Usuario', userId);
      }

      return user.supervisorId === supervisorId;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      
      logger.error('Error checking supervisor relationship', {
        supervisorId,
        userId,
        error: error.message,
      });
      throw new DatabaseError('Error al verificar relación de supervisor', error);
    }
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(id) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          lastLoginAt: new Date(),
        },
      });

      logger.debug('Last login updated', { userId: id });
      return user;
    } catch (error) {
      logger.error('Error updating last login', {
        userId: id,
        error: error.message,
      });
      throw new DatabaseError('Error al actualizar último login', error);
    }
  }

  /**
   * Contar usuarios con filtros
   */
  async count(filters = {}) {
    try {
      const where = this.buildWhereClause(filters);
      const count = await this.prisma.user.count({ where });

      logger.debug('User count calculated', { filters, count });
      return count;
    } catch (error) {
      logger.error('Error counting users', {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al contar usuarios', error);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStats(filters = {}) {
    try {
      const where = this.buildWhereClause(filters);

      const [
        totalUsers,
        usersByRole,
        activeUsers,
        usersWithSupervisor,
      ] = await Promise.all([
        // Total de usuarios
        this.prisma.user.count({ where }),
        
        // Usuarios por rol
        this.prisma.user.groupBy({
          by: ['role'],
          where,
          _count: true,
        }),
        
        // Usuarios activos
        this.prisma.user.count({
          where: {
            ...where,
            isActive: true,
          },
        }),
        
        // Usuarios con supervisor
        this.prisma.user.count({
          where: {
            ...where,
            supervisorId: { not: null },
          },
        }),
      ]);

      // Formatear estadísticas
      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersWithSupervisor,
        usersWithoutSupervisor: totalUsers - usersWithSupervisor,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {}),
      };

      logger.debug('User stats calculated', {
        filters,
        stats: {
          totalUsers,
          activeUsers,
          usersByRole: stats.usersByRole,
        },
      });

      return stats;
    } catch (error) {
      logger.error('Error getting user stats', {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new DatabaseError('Error al obtener estadísticas de usuarios', error);
    }
  }

  /**
   * Construir cláusula WHERE para filtros
   */
  buildWhereClause(filters = {}) {
    const where = {};

    // Filtro por rol
    if (filters.role) {
      where.role = filters.role;
    }

    // Filtro por supervisor
    if (filters.supervisorId) {
      if (filters.supervisorId === 'null') {
        where.supervisorId = null;
      } else {
        where.supervisorId = filters.supervisorId;
      }
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
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
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
module.exports = new UserRepository();