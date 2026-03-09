const prisma = require("../config/database");

/**
 * Controlador para crear una nueva visita
 */
exports.createVisit = async (req, res) => {
  try {
    const { clientId, notes, latitude, longitude } = req.body;
    const promoterId = req.user.id;

    // Validación de campos requeridos
    if (!clientId || !notes) {
      return res.status(400).json({
        success: false,
        message: "clientId y notes son requeridos"
      });
    }

    const beforePhotos = [];
    const afterPhotos = [];

    if (req.files) {
      req.files.forEach(file => {
        if (file.fieldname === "beforePhotos") {
          beforePhotos.push("/uploads/visits/" + file.filename);
        }

        if (file.fieldname === "afterPhotos") {
          afterPhotos.push("/uploads/visits/" + file.filename);
        }
      });
    }

    const visit = await prisma.visit.create({
      data: {
        promoterId,
        clientId,
        notes: notes || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        beforePhotos,
        afterPhotos
      }
    });

    res.status(201).json({
      success: true,
      data: { visit }
    });

  } catch (error) {
    console.error("Error creando visita:", error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: "Cliente o promotor no encontrado"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creando visita"
    });
  }
};

/**
 * Controlador para obtener visitas con filtros por rol de usuario
 */
exports.getVisits = async (req, res) => {
  try {
    const { page = 1, limit = 10, promoterId: filterPromoterId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros base
    const where = {};

    // Filtrar por rol de usuario según las reglas de negocio
    if (userRole === 'PROMOTER') {
      // PROMOTER → solo visitas donde promoterId = user.id
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR' || userRole === 'VIEWER') {
      // SUPERVISOR y VIEWER → visitas donde promoter.supervisorId = user.id
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
      
      // Si se proporciona un promoterId específico, verificar que pertenezca al supervisor
      if (filterPromoterId && userRole === 'SUPERVISOR') {
        const promoter = await prisma.user.findFirst({
          where: { 
            id: filterPromoterId,
            supervisorId: userId 
          }
        });
        
        if (promoter) {
          where.promoterId = filterPromoterId;
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para ver visitas de este promotor'
          });
        }
      }
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // ADMIN y SUPER_ADMIN → todas las visitas
      // Si se proporciona un promoterId específico, filtrar por ese promotor
      if (filterPromoterId) {
        where.promoterId = filterPromoterId;
      }
    } else {
      // Para otros roles no definidos, por defecto solo sus visitas
      where.promoterId = userId;
    }

    // Obtener visitas con paginación
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          promoter: {
            select: {
              id: true,
              name: true
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
    console.error("Error obteniendo visitas:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo visitas"
    });
  }
};

/**
 * Controlador para obtener una visita específica
 */
exports.getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener la visita primero sin filtros de rol
    const visit = await prisma.visit.findUnique({
      where: { id },
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
            email: true,
            supervisorId: true
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

    // Validar acceso por rol
    if (userRole === 'PROMOTER') {
      // PROMOTER: Solo puede acceder si la visita pertenece a él
      if (visit.promoterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a esta visita'
        });
      }
    } else if (userRole === 'SUPERVISOR') {
      // SUPERVISOR: Solo puede acceder si el promoter.supervisorId = user.id
      if (!visit.promoter || visit.promoter.supervisorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a esta visita'
        });
      }
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // ADMIN y SUPER_ADMIN: Pueden acceder siempre
      // No se requiere validación adicional
    } else {
      // Para otros roles (incluyendo VIEWER), no permitir acceso
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta visita'
      });
    }

    res.status(200).json({
      success: true,
      data: { visit }
    });
  } catch (error) {
    console.error("Error obteniendo visita:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo visita"
    });
  }
};

/**
 * Controlador para actualizar una visita (solo notas y coordenadas)
 */
exports.updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { notes, latitude, longitude } = req.body;

    // Validar coordenadas si se proporcionan
    if (latitude && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Latitud inválida. Debe estar entre -90 y 90 grados'
      });
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Longitud inválida. Debe estar entre -180 y 180 grados'
      });
    }

    // Construir filtro según el rol del usuario
    const where = { id };

    // Si el usuario es PROMOTER o VIEWER, solo puede actualizar sus propias visitas
    // Si el usuario es ADMIN o SUPER_ADMIN, puede actualizar cualquier visita
    // Si el usuario es SUPERVISOR, puede actualizar visitas de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden actualizar visitas de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    }
    // Para ADMIN y SUPER_ADMIN no se agrega filtro de promoterId

    // Verificar que la visita existe y el usuario tiene permisos
    const existingVisit = await prisma.visit.findFirst({
      where
    });

    if (!existingVisit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    // Preparar datos para actualizar (solo campos permitidos)
    const updateData = {};
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (latitude !== undefined) {
      updateData.latitude = latitude ? parseFloat(latitude) : null;
    }
    
    if (longitude !== undefined) {
      updateData.longitude = longitude ? parseFloat(longitude) : null;
    }

    // Realizar la actualización
    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: updateData,
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

    res.status(200).json({
      success: true,
      message: 'Visita actualizada exitosamente',
      data: { visit: updatedVisit }
    });
  } catch (error) {
    console.error("Error actualizando visita:", error);
    res.status(500).json({
      success: false,
      message: "Error actualizando visita"
    });
  }
};

/**
 * Controlador para eliminar una visita
 */
exports.deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Construir filtro según el rol del usuario
    const where = { id };

    // Si el usuario es PROMOTER o VIEWER, solo puede eliminar sus propias visitas
    // Si el usuario es ADMIN o SUPER_ADMIN, puede eliminar cualquier visita
    // Si el usuario es SUPERVISOR, puede eliminar visitas de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden eliminar visitas de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    }
    // Para ADMIN y SUPER_ADMIN no se agrega filtro de promoterId

    // Verificar que la visita existe y el usuario tiene permisos
    const existingVisit = await prisma.visit.findFirst({
      where
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
    console.error("Error eliminando visita:", error);
    res.status(500).json({
      success: false,
      message: "Error eliminando visita"
    });
  }
};

/**
 * Controlador para obtener estadísticas de visitas
 */
exports.getVisitStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { startDate, endDate, promoterId: filterPromoterId } = req.query;

    // Construir filtros base
    const where = {};

    // Filtrar por rol de usuario
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // Los administradores pueden ver estadísticas de cualquier promotor
      if (filterPromoterId) {
        where.promoterId = filterPromoterId;
      }
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden ver estadísticas de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
      
      // Si se proporciona un promoterId específico, verificar que pertenezca al supervisor
      if (filterPromoterId) {
        const promoter = await prisma.user.findFirst({
          where: { 
            id: filterPromoterId,
            supervisorId: userId 
          }
        });
        
        if (promoter) {
          where.promoterId = filterPromoterId;
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para ver estadísticas de este promotor'
          });
        }
      }
    } else {
      // Para otros roles no definidos, por defecto solo sus estadísticas
      where.promoterId = userId;
    }

    // Construir filtros de fecha
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // Obtener estadísticas básicas
    const [totalVisits, visitsByDay] = await Promise.all([
      // Total de visitas
      prisma.visit.count({ where }),
      
      // Visitas por día (últimos 7 días)
      prisma.visit.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    // Formatear estadísticas
    const stats = {
      totalVisits,
      visitsByDay: visitsByDay.map(item => ({
        date: item.createdAt,
        count: item._count
      }))
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo estadísticas"
    });
  }
};