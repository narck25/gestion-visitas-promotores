const prisma = require('../config/database');

/**
 * Controlador para crear una visita
 */
const createVisit = async (req, res, next) => {
  try {
    const { clientId, date, latitude, longitude, address, notes, photos, signature } = req.body;
    const promoterId = req.user.id;

    // Validar campos requeridos
    if (!clientId || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Cliente y notas son requeridos'
      });
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Crear visita
    const visit = await prisma.visit.create({
      data: {
        promoterId,
        clientId,
        date: date ? new Date(date) : new Date(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        notes,
        photos: photos || [],
        signature: signature || null,
        status: 'COMPLETED'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Visita creada exitosamente',
      data: { visit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener todas las visitas del promotor
 */
const getVisits = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const promoterId = req.user.id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      promoterId
    };

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
 * Controlador para obtener una visita específica
 */
const getVisitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoterId = req.user.id;

    const visit = await prisma.visit.findFirst({
      where: {
        id,
        promoterId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            businessType: true
          }
        },
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: { visit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar una visita
 */
const updateVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoterId = req.user.id;
    const { notes, status, photos, signature } = req.body;

    // Verificar que la visita existe y pertenece al promotor
    const existingVisit = await prisma.visit.findFirst({
      where: {
        id,
        promoterId
      }
    });

    if (!existingVisit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    // Actualizar visita
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        notes: notes || existingVisit.notes,
        status: status || existingVisit.status,
        photos: photos || existingVisit.photos,
        signature: signature || existingVisit.signature
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Visita actualizada exitosamente',
      data: { visit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para eliminar una visita
 */
const deleteVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoterId = req.user.id;

    // Verificar que la visita existe y pertenece al promotor
    const existingVisit = await prisma.visit.findFirst({
      where: {
        id,
        promoterId
      }
    });

    if (!existingVisit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    // Eliminar visita
    await prisma.visit.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Visita eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener estadísticas de visitas
 */
const getVisitStats = async (req, res, next) => {
  try {
    const promoterId = req.user.id;
    const { startDate, endDate } = req.query;

    // Construir filtros de fecha
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const where = {
      promoterId
    };

    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    // Obtener estadísticas
    const [totalVisits, visitsByStatus, visitsByDay] = await Promise.all([
      // Total de visitas
      prisma.visit.count({ where }),
      
      // Visitas por estado
      prisma.visit.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      
      // Visitas por día (últimos 7 días)
      prisma.visit.groupBy({
        by: ['date'],
        where: {
          ...where,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true,
        orderBy: {
          date: 'asc'
        }
      })
    ]);

    // Formatear estadísticas
    const stats = {
      totalVisits,
      visitsByStatus: visitsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      visitsByDay: visitsByDay.map(item => ({
        date: item.date,
        count: item._count
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

module.exports = {
  createVisit,
  getVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
  getVisitStats
};