const prisma = require('../config/database');

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

    // Filtrar por rol de usuario
    // Si el usuario es PROMOTER, solo puede ver sus propios clientes
    // Si el usuario es ADMIN o SUPER_ADMIN, puede ver todos los clientes
    // Si el usuario es SUPERVISOR, puede ver clientes de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // Los administradores pueden ver todos los clientes
      // Si se proporciona un promoterId específico, filtrar por ese promotor
      if (filterPromoterId) {
        where.promoterId = filterPromoterId;
      }
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden ver clientes de sus promotores
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
            message: 'No tienes permisos para ver clientes de este promotor'
          });
        }
      }
    } else {
      // Para otros roles no definidos, por defecto solo sus clientes
      where.promoterId = userId;
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
 * Controlador para crear un nuevo cliente
 */
const createClient = async (req, res, next) => {
  try {
    const { name, phone, email, address, businessType, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es requerido'
      });
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
        return res.status(404).json({
          success: false,
          message: 'Promotor no encontrado'
        });
      }

      // Verificar que el promotor tenga rol PROMOTER
      if (promoter.role !== 'PROMOTER') {
        return res.status(400).json({
          success: false,
          message: 'El usuario asignado debe tener rol PROMOTER'
        });
      }

      // Si el usuario es SUPERVISOR, verificar que el promotor pertenezca a él
      if (userRole === 'SUPERVISOR' && promoter.supervisorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para asignar clientes a este promotor'
        });
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

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: { client }
    });
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

    // Construir filtro según el rol del usuario
    const where = { id };

    // Si el usuario es PROMOTER o VIEWER, solo puede ver sus propios clientes
    // Si el usuario es ADMIN o SUPER_ADMIN, puede ver cualquier cliente
    // Si el usuario es SUPERVISOR, puede ver clientes de sus promotores
    if (userRole === 'PROMOTER' || userRole === 'VIEWER') {
      where.promoterId = userId;
    } else if (userRole === 'SUPERVISOR') {
      // Los supervisores pueden ver clientes de sus promotores
      const promoterIds = await prisma.user.findMany({
        where: { supervisorId: userId },
        select: { id: true }
      });
      
      where.promoterId = {
        in: promoterIds.map(p => p.id)
      };
    }
    // Para ADMIN y SUPER_ADMIN no se agrega filtro de promoterId

    const client = await prisma.client.findFirst({
      where,
      include: {
        promoter: {
          select: {
            id: true,
            name: true,
            email: true
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
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
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
        return res.status(404).json({
          success: false,
          message: 'Promotor no encontrado'
        });
      }

      // Verificar que el promotor tenga rol PROMOTER
      if (promoter.role !== 'PROMOTER') {
        return res.status(400).json({
          success: false,
          message: 'El usuario asignado debe tener rol PROMOTER'
        });
      }

      // Si el usuario es SUPERVISOR, verificar que el promotor pertenezca a él
      if (userRole === 'SUPERVISOR' && promoter.supervisorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para asignar clientes a este promotor'
        });
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

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: { client: updatedClient }
    });
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
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Eliminar cliente (las visitas se eliminarán en cascada)
    await prisma.client.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
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

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats
};
