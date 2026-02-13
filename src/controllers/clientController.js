const prisma = require('../config/database');

/**
 * Helper functions for standardized responses
 */
function successResponse(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data
  });
}

function errorResponse(res, message, status = 500) {
  return res.status(status).json({
    success: false,
    error: message
  });
}

/**
 * Controlador para obtener todos los clientes con filtros por rol
 */
const getAllClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', promoterId: filterPromoterId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros base
    const where = {};

    // Filtrar por rol de usuario según las reglas de negocio
    if (userRole === 'PROMOTER') {
      // PROMOTER → solo clientes donde promoterId = user.id
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // SUPERVISOR → clientes:
      // a) donde promoter.supervisorId = user.id
      // b) o clientes sin asignar (promoterId = null)
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      const promoterIdList = promoterIds.map(p => p.id);
      
      where.OR = [
        {
          promoterId: {
            in: promoterIdList
          }
        },
        {
          promoterId: null
        }
      ];
      
      // Si se proporciona un promoterId específico, verificar que pertenezca al supervisor
      if (filterPromoterId) {
        if (filterPromoterId === 'null') {
          // Si se solicita ver clientes sin asignar
          where.promoterId = null;
          delete where.OR; // Eliminar el OR ya que ahora solo queremos null
        } else {
          const promoter = await prisma.user.findFirst({
            where: { 
              id: filterPromoterId,
              supervisorId: userId 
            }
          });
          
          if (promoter) {
            where.promoterId = filterPromoterId;
            delete where.OR; // Eliminar el OR ya que ahora solo queremos este promotor específico
          } else {
            return errorResponse(res, 'No tienes permisos para ver clientes de este promotor', 403);
          }
        }
      }
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // ADMIN y SUPER_ADMIN → todos los clientes
      // Si se proporciona un promoterId específico, filtrar por ese promotor
      if (filterPromoterId) {
        if (filterPromoterId === 'null') {
          where.promoterId = null;
        } else {
          where.promoterId = filterPromoterId;
        }
      }
    } else if (userRole === 'VIEWER') {
      // VIEWER → solo clientes donde promoter.supervisorId = user.id
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    } else {
      // Para otros roles no definidos, por defecto solo sus clientes
      where.promoterId = userId;
    }

    // Filtro de búsqueda
    if (search) {
      where.OR = where.OR || [];
      where.OR.push(
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } }
      );
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

    return successResponse(res, {
      clients,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para crear un nuevo cliente
 */
const createClient = async (req, res, next) => {
  try {
    const { name, phone, email, address, businessType, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar campos requeridos
    if (!name) {
      return errorResponse(res, 'El nombre del cliente es requerido', 400);
    }

    // Determinar el promoterId para el cliente
    let promoterId = userId;
    
    // Si el usuario es ADMIN, SUPER_ADMIN o SUPERVISOR, puede asignar el cliente a un promotor específico
    if (req.body.promoterId && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERVISOR')) {
      // Verificar que el promotor existe
      const promoter = await prisma.user.findUnique({
        where: { id: req.body.promoterId },
        select: { id: true, role: true, supervisorId: true }
      });

      if (!promoter) {
        return errorResponse(res, 'Promotor no encontrado', 404);
      }

      // Verificar que el promotor tenga rol PROMOTER
      if (promoter.role !== 'PROMOTER') {
        return errorResponse(res, 'El usuario asignado debe tener rol PROMOTER', 400);
      }

      // Si el usuario es SUPERVISOR, verificar que el promotor pertenezca a él
      if (userRole === 'SUPERVISOR' && promoter.supervisorId !== userId) {
        return errorResponse(res, 'No tienes permisos para asignar clientes a este promotor', 403);
      }

      promoterId = req.body.promoterId;
    }

    // Crear cliente
    const client = await prisma.client.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        businessType: businessType || null,
        notes: notes || null,
        promoterId
      },
      include: {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return successResponse(res, { client }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener un cliente específico
 */
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener el cliente primero sin filtros de rol
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true,
            supervisorId: true
          }
        },
        visits: {
          take: 10,
          orderBy: {
            date: 'desc'
          },
          select: {
            id: true,
            date: true,
            notes: true,
            status: true
          }
        },
        _count: {
          select: {
            visits: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Validar acceso por rol
    if (userRole === 'PROMOTER') {
      // PROMOTER: Solo puede acceder si el cliente pertenece a él
      if (client.promoterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este cliente'
        });
      }
    } else if (userRole === 'SUPERVISOR') {
      // SUPERVISOR: Solo puede acceder si el promoter.supervisorId = user.id
      // o si el cliente no tiene promotor asignado
      if (client.promoterId) {
        // Si tiene promotor, verificar que el supervisor sea su supervisor
        if (!client.promoter || client.promoter.supervisorId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a este cliente'
          });
        }
      }
      // Si no tiene promotor (promoterId = null), el supervisor puede acceder
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // ADMIN y SUPER_ADMIN: Pueden acceder siempre
      // No se requiere validación adicional
    } else {
      // Para otros roles (incluyendo VIEWER), no permitir acceso
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este cliente'
      });
    }

    res.status(200).json({
      success: true,
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar un cliente
 */
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, phone, email, address, businessType, notes, promoterId: newPromoterId } = req.body;

    // Construir filtro según el rol del usuario
    const where = { id };

    // Si el usuario es PROMOTER o VIEWER, solo puede actualizar sus propios clientes
    // Si el usuario es ADMIN o SUPER_ADMIN, puede actualizar cualquier cliente
    // Si el usuario es SUPERVISOR, puede actualizar clientes de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden actualizar clientes de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    }
    // Para ADMIN y SUPER_ADMIN no se agrega filtro de promoterId

    // Verificar que el cliente existe y el usuario tiene permisos
    const existingClient = await prisma.client.findFirst({
      where
    });

    if (!existingClient) {
      return errorResponse(res, 'Cliente no encontrado', 404);
    }

    // Preparar datos para actualizar
    const updateData = {
      name: name || existingClient.name,
      phone: phone !== undefined ? (phone || null) : existingClient.phone,
      email: email !== undefined ? (email || null) : existingClient.email,
      address: address !== undefined ? (address || null) : existingClient.address,
      businessType: businessType !== undefined ? (businessType || null) : existingClient.businessType,
      notes: notes !== undefined ? (notes || null) : existingClient.notes
    };

    // Si se proporciona un nuevo promoterId y el usuario tiene permisos
    if (newPromoterId && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERVISOR')) {
      // Verificar que el promotor existe
      const promoter = await prisma.user.findUnique({
        where: { id: newPromoterId },
        select: { id: true, role: true, supervisorId: true }
      });

      if (!promoter) {
        return errorResponse(res, 'Promotor no encontrado', 404);
      }

      // Verificar que el promotor tenga rol PROMOTER
      if (promoter.role !== 'PROMOTER') {
        return errorResponse(res, 'El usuario asignado debe tener rol PROMOTER', 400);
      }

      // Si el usuario es SUPERVISOR, verificar que el promotor pertenezca a él
      if (userRole === 'SUPERVISOR' && promoter.supervisorId !== userId) {
        return errorResponse(res, 'No tienes permisos para asignar clientes a este promotor', 403);
      }

      updateData.promoterId = newPromoterId;
    }

    // Realizar la actualización
    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return successResponse(res, { client: updatedClient });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para eliminar un cliente
 */
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Construir filtro según el rol del usuario
    const where = { id };

    // Si el usuario es PROMOTER o VIEWER, solo puede eliminar sus propios clientes
    // Si el usuario es ADMIN o SUPER_ADMIN, puede eliminar cualquier cliente
    // Si el usuario es SUPERVISOR, puede eliminar clientes de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden eliminar clientes de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    }
    // Para ADMIN y SUPER_ADMIN no se agrega filtro de promoterId

    // Verificar que el cliente existe y el usuario tiene permisos
    const existingClient = await prisma.client.findFirst({
      where
    });

    if (!existingClient) {
      return errorResponse(res, 'Cliente no encontrado', 404);
    }

    // Eliminar cliente (las visitas se eliminarán en cascada)
    await prisma.client.delete({
      where: { id }
    });

    return successResponse(res, { message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener estadísticas de clientes
 */
const getClientStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { promoterId: filterPromoterId } = req.query;

    // Construir filtros base
    const where = {};

    // Filtrar por rol de usuario
    // Si el usuario es PROMOTER o VIEWER, solo puede ver sus propias estadísticas
    // Si el usuario es ADMIN o SUPER_ADMIN, puede ver estadísticas de cualquier promotor
    // Si el usuario es SUPERVISOR, puede ver estadísticas de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // Los administradores pueden ver estadísticas de cualquier promotor
      // Si se proporciona un promoterId específico, filtrar por ese promotor
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

    // Obtener estadísticas
    const [totalClients, clientsByBusinessType, clientsWithVisits] = await Promise.all([
      // Total de clientes
      prisma.client.count({ where }),
      
      // Clientes por tipo de negocio
      prisma.client.groupBy({
        by: ['businessType'],
        where,
        _count: true
      }),
      
      // Clientes con visitas (últimos 30 días)
      prisma.client.count({
        where: {
          ...where,
          visits: {
            some: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      })
    ]);

    // Formatear estadísticas
    const stats = {
      totalClients,
      clientsByBusinessType: clientsByBusinessType.reduce((acc, item) => {
        acc[item.businessType || 'Sin tipo'] = item._count;
        return acc;
      }, {}),
      clientsWithVisits,
      clientsWithoutVisits: totalClients - clientsWithVisits
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
 * Controlador para asignar un cliente a un promotor
 * PATCH /api/clients/:id/assign
 * Solo permitido para ADMIN y SUPERVISOR
 */
const assignClientToPromoter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { promoterId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar que solo ADMIN y SUPERVISOR pueden usar este endpoint
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar clientes a promotores'
      });
    }

    // Validar que se proporcionó promoterId
    if (!promoterId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del promotor es requerido'
      });
    }

    // 1. Validar que el cliente exista
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // 2. Validar que el promotor exista y tenga role = PROMOTER
    const promoter = await prisma.user.findUnique({
      where: { id: promoterId },
      select: { id: true, role: true, supervisorId: true }
    });

    if (!promoter) {
      return res.status(404).json({
        success: false,
        message: 'Promotor no encontrado'
      });
    }

    if (promoter.role !== 'PROMOTER') {
      return res.status(400).json({
        success: false,
        message: 'El usuario asignado debe tener rol PROMOTER'
      });
    }

    // 3. Si el usuario es SUPERVISOR, verificar que promoter.supervisorId = user.id
    if (userRole === 'SUPERVISOR' && promoter.supervisorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar clientes a este promotor'
      });
    }

    // 4. Actualizar client.promoterId
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        promoterId
      },
      include: {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 5. Retornar cliente actualizado con promoter (id, name, email)
    res.status(200).json({
      success: true,
      message: 'Cliente asignado exitosamente al promotor',
      data: { client: updatedClient }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  assignClientToPromoter
};
