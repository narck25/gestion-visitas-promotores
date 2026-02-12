const prisma = require('../config/database');

/**
 * Controlador para obtener todos los promotores asignados a un supervisor
 */
const getPromoters = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, search = '' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden acceder a esta función'
      });
    }

    // Construir filtros
    const where = {
      supervisorId: userId,
      role: 'PROMOTER',
      isActive: true
    };

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Obtener promotores con paginación
    const [promoters, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              clients: true,
              visits: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        promoters,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener todos los clientes de los promotores asignados a un supervisor
 */
const getClients = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, search = '', promoterId: filterPromoterId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden acceder a esta función'
      });
    }

    // Obtener IDs de promotores asignados al supervisor
    const promoterIds = await prisma.user.findMany({
      where: { 
        supervisorId: userId,
        role: 'PROMOTER'
      },
      select: { id: true }
    });

    const promoterIdList = promoterIds.map(p => p.id);

    // Si no hay promotores asignados
    if (promoterIdList.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          clients: [],
          pagination: {
            page: parseInt(page),
            limit: take,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Construir filtros
    const where = {
      promoterId: {
        in: promoterIdList
      }
    };

    // Si se proporciona un promoterId específico, verificar que pertenezca al supervisor
    if (filterPromoterId) {
      if (!promoterIdList.includes(filterPromoterId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver clientes de este promotor'
        });
      }
      where.promoterId = filterPromoterId;
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Obtener clientes con paginación
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
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
        }
      }),
      prisma.client.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener todas las visitas de los promotores asignados a un supervisor
 */
const getVisits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, search = '', promoterId: filterPromoterId, status, startDate, endDate } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden acceder a esta función'
      });
    }

    // Obtener IDs de promotores asignados al supervisor
    const promoterIds = await prisma.user.findMany({
      where: { 
        supervisorId: userId,
        role: 'PROMOTER'
      },
      select: { id: true }
    });

    const promoterIdList = promoterIds.map(p => p.id);

    // Si no hay promotores asignados
    if (promoterIdList.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          visits: [],
          pagination: {
            page: parseInt(page),
            limit: take,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Construir filtros
    const where = {
      promoterId: {
        in: promoterIdList
      }
    };

    // Si se proporciona un promoterId específico, verificar que pertenezca al supervisor
    if (filterPromoterId) {
      if (!promoterIdList.includes(filterPromoterId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver visitas de este promotor'
        });
      }
      where.promoterId = filterPromoterId;
    }

    // Filtros adicionales
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Obtener visitas con paginación
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy: {
          date: 'desc'
        },
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
              phone: true
            }
          }
        }
      }),
      prisma.visit.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      data: {
        visits,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener estadísticas de supervisión
 */
const getSupervisorStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden acceder a esta función'
      });
    }

    // Obtener IDs de promotores asignados al supervisor
    const promoterIds = await prisma.user.findMany({
      where: { 
        supervisorId: userId,
        role: 'PROMOTER'
      },
      select: { id: true }
    });

    const promoterIdList = promoterIds.map(p => p.id);

    // Si no hay promotores asignados
    if (promoterIdList.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalPromoters: 0,
            totalClients: 0,
            totalVisits: 0,
            visitsLast7Days: 0,
            visitsByStatus: {},
            clientsByPromoter: []
          }
        }
      });
    }

    // Obtener estadísticas en paralelo
    const [
      totalPromoters,
      totalClients,
      totalVisits,
      visitsLast7Days,
      visitsByStatus,
      clientsByPromoter
    ] = await Promise.all([
      // Total de promotores
      prisma.user.count({
        where: { 
          supervisorId: userId,
          role: 'PROMOTER',
          isActive: true
        }
      }),
      
      // Total de clientes
      prisma.client.count({
        where: {
          promoterId: {
            in: promoterIdList
          }
        }
      }),
      
      // Total de visitas
      prisma.visit.count({
        where: {
          promoterId: {
            in: promoterIdList
          }
        }
      }),
      
      // Visitas en los últimos 7 días
      prisma.visit.count({
        where: {
          promoterId: {
            in: promoterIdList
          },
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Visitas por estado
      prisma.visit.groupBy({
        by: ['status'],
        where: {
          promoterId: {
            in: promoterIdList
          }
        },
        _count: true
      }),
      
      // Clientes por promotor
      prisma.user.findMany({
        where: { 
          supervisorId: userId,
          role: 'PROMOTER',
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              clients: true,
              visits: {
                where: {
                  date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        }
      })
    ]);

    // Formatear estadísticas
    const stats = {
      totalPromoters,
      totalClients,
      totalVisits,
      visitsLast7Days,
      visitsByStatus: visitsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      clientsByPromoter: clientsByPromoter.map(promoter => ({
        id: promoter.id,
        name: promoter.name,
        email: promoter.email,
        totalClients: promoter._count.clients,
        visitsLast30Days: promoter._count.visits
      }))
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para asignar un promotor a un supervisor
 */
const assignPromoter = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { promoterId } = req.body;

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden asignar promotores'
      });
    }

    // Verificar que el promotor existe
    const promoter = await prisma.user.findUnique({
      where: { id: promoterId },
      select: { id: true, role: true }
    });

    if (!promoter) {
      return res.status(404).json({
        success: false,
        message: 'Promotor no encontrado'
      });
    }

    // Verificar que el usuario es un promotor
    if (promoter.role !== 'PROMOTER') {
      return res.status(400).json({
        success: false,
        message: 'El usuario debe tener rol PROMOTER para ser asignado'
      });
    }

    // Asignar promotor al supervisor
    const updatedPromoter = await prisma.user.update({
      where: { id: promoterId },
      data: { supervisorId: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        supervisorId: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Promotor asignado exitosamente',
      data: { promoter: updatedPromoter }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Promotor no encontrado'
      });
    }
    next(error);
  }
};

/**
 * Controlador para desasignar un promotor de un supervisor
 */
const unassignPromoter = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { promoterId } = req.params;

    // Verificar que el usuario es supervisor
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden desasignar promotores'
      });
    }

    // Verificar que el promotor existe y está asignado a este supervisor
    const promoter = await prisma.user.findFirst({
      where: { 
        id: promoterId,
        supervisorId: userId,
        role: 'PROMOTER'
      }
    });

    if (!promoter) {
      return res.status(404).json({
        success: false,
        message: 'Promotor no encontrado o no está asignado a este supervisor'
      });
    }

    // Desasignar promotor
    const updatedPromoter = await prisma.user.update({
      where: { id: promoterId },
      data: { supervisorId: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        supervisorId: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Promotor desasignado exitosamente',
      data: { promoter: updatedPromoter }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Promotor no encontrado'
      });
    }
    next(error);
  }
};

module.exports = {
  getPromoters,
  getClients,
  getVisits,
  getSupervisorStats,
  assignPromoter,
  unassignPromoter
};