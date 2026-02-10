const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Controlador para obtener todos los usuarios (solo admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROMOTER', 'VIEWER'].includes(role)) {
      where.role = role;
    }

    // Obtener usuarios con paginación
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              visits: true,
              clients: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener todos los clientes (solo admin)
 */
const getAllClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', promoterId = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (promoterId) {
      where.promoterId = promoterId;
    }

    // Obtener clientes con paginación
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          promoter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              visits: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.client.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener todas las visitas (solo admin)
 */
const getAllVisits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', promoterId = '', clientId = '', status = '', purpose = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (promoterId) {
      where.promoterId = promoterId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (status && ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      where.status = status;
    }

    if (purpose && ['SALES', 'FOLLOW_UP', 'DELIVERY', 'TRAINING', 'COMPLAINT', 'OTHER'].includes(purpose)) {
      where.purpose = purpose;
    }

    // Obtener visitas con paginación
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          promoter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              businessName: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.visit.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        visits,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener estadísticas del sistema (solo admin)
 */
const getSystemStats = async (req, res, next) => {
  try {
    // Obtener estadísticas en paralelo
    const [
      totalUsers,
      totalClients,
      totalVisits,
      activePromoters,
      recentVisits,
      visitsByStatus,
      visitsByPurpose
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count({ where: { isActive: true } }),
      
      // Total de clientes
      prisma.client.count({ where: { isActive: true } }),
      
      // Total de visitas
      prisma.visit.count(),
      
      // Promotores activos (con visitas en los últimos 30 días)
      prisma.user.count({
        where: {
          role: 'PROMOTER',
          isActive: true,
          visits: {
            some: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
              }
            }
          }
        }
      }),
      
      // Visitas recientes (últimos 7 días)
      prisma.visit.count({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        }
      }),
      
      // Visitas por estado
      prisma.visit.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Visitas por propósito
      prisma.visit.groupBy({
        by: ['purpose'],
        _count: true
      })
    ]);

    // Formatear estadísticas
    const stats = {
      totals: {
        users: totalUsers,
        clients: totalClients,
        visits: totalVisits,
        activePromoters
      },
      recentActivity: {
        visitsLast7Days: recentVisits
      },
      visitsByStatus: visitsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      visitsByPurpose: visitsByPurpose.reduce((acc, item) => {
        acc[item.purpose] = item._count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar rol de usuario (solo admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validar rol
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROMOTER', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    // Verificar que no sea el último admin
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'SUPER_ADMIN' }
          ],
          id: { not: userId }
        }
      });

      if (adminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el último administrador del sistema'
        });
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('Rol de usuario actualizado', {
      userId,
      newRole: role,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Rol de usuario actualizado exitosamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    next(error);
  }
};

/**
 * Controlador para activar/desactivar usuario (solo admin)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validar que no sea el último admin activo
    if (isActive === false) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
        const activeAdminCount = await prisma.user.count({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ],
            isActive: true,
            id: { not: userId }
          }
        });

        if (activeAdminCount === 0) {
          return res.status(400).json({
            success: false,
            message: 'No se puede desactivar el último administrador activo del sistema'
          });
        }
      }
    }

    // Actualizar estado del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('Estado de usuario actualizado', {
      userId,
      newStatus: isActive,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: { user: updatedUser }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllClients,
  getAllVisits,
  getSystemStats,
  updateUserRole,
  toggleUserStatus
};