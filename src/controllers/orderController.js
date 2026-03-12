const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { AuthorizationError, validateResourceOwnership } = require('../middleware/permissions');

/**
 * Función auxiliar para validar acceso a un pedido según rol
 */
async function validateOrderAccess(user, order) {
  if (!user) {
    throw new AuthorizationError('Usuario no autenticado', 401);
  }

  // ADMIN, CAPTURISTA, SUPER_ADMIN tienen acceso a todo
  if (['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN'].includes(user.role)) {
    return true;
  }

  // PROMOTER: solo sus propios pedidos
  if (user.role === 'PROMOTER') {
    if (order.userId !== user.id) {
      throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
    }
    return true;
  }

  // SUPERVISOR: pedidos de sus promotores
  if (user.role === 'SUPERVISOR') {
    const promoter = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { supervisorId: true }
    });

    if (!promoter || promoter.supervisorId !== user.id) {
      throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
    }
    return true;
  }

  // VIEWER: solo lectura de pedidos de sus promotores
  if (user.role === 'VIEWER') {
    const promoter = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { supervisorId: true }
    });

    if (!promoter || promoter.supervisorId !== user.id) {
      throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
    }
    return true;
  }

  throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
}

/**
 * Controlador para gestión de pedidos
 */
class OrderController {
  /**
   * Crear un nuevo pedido
   * POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const { items } = req.body;
      const userId = req.user.id;

      // Validar que haya items
      if (!items || items.length === 0) {
        return res.status(400).json({
          message: 'El pedido debe tener al menos un producto'
        });
      }

      // Validar estructura de items
      for (const item of items) {
        if (!item.productId) {
          return res.status(400).json({
            message: 'Cada item debe tener productId'
          });
        }

        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            message: 'La cantidad debe ser mayor a 0'
          });
        }
      }

      // Verificar que todos los productos existan
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        select: {
          id: true,
          sku: true,
          description: true
        }
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        return res.status(404).json({
          message: 'Algunos productos no existen',
          missingProductIds: missingIds
        });
      }

      // Crear el pedido con transacción
      const order = await prisma.$transaction(async (tx) => {
        // Crear el pedido
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: 'PENDING'
          }
        });

        // Crear los items del pedido
        const orderItems = await Promise.all(
          items.map(item =>
            tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity
              },
              include: {
                product: {
                  select: {
                    sku: true,
                    description: true
                  }
                }
              }
            })
          )
        );

        return {
          ...newOrder,
          items: orderItems
        };
      });

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        order
      });
    } catch (error) {
      console.error('Error al crear pedido:', error);
      res.status(500).json({
        error: 'Error interno del servidor al crear pedido'
      });
    }
  }

  /**
   * Listar pedidos según permisos
   * GET /api/orders
   */
  async listOrders(req, res) {
    try {
      const user = req.user;
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir condiciones de filtro
      const where = {};

      // Filtrar por estado si se especifica
      if (status && ['PENDING', 'CAPTURED', 'CANCELLED'].includes(status)) {
        where.status = status;
      }

      // Aplicar filtros según rol
      if (user.role === 'PROMOTER') {
        // PROMOTER: solo sus pedidos
        where.userId = user.id;
      } else if (user.role === 'SUPERVISOR') {
        // SUPERVISOR: pedidos de sus promotores
        const supervisedPromoters = await prisma.user.findMany({
          where: {
            supervisorId: user.id,
            role: 'PROMOTER'
          },
          select: { id: true }
        });
        const promoterIds = supervisedPromoters.map(p => p.id);
        where.userId = { in: promoterIds };
      }
      // ADMIN, CAPTURISTA, SUPER_ADMIN: todos los pedidos (sin filtro adicional)

      // Obtener pedidos con paginación
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    sku: true,
                    description: true,
                    listPrice: true
                  }
                }
              }
            }
          }
        }),
        prisma.order.count({ where })
      ]);

      // Formatear órdenes para el frontend
      const formattedOrders = orders.map(order => ({
        id: order.id,
        client: {
          id: order.user?.id || '0',
          name: order.user?.name || 'Usuario desconocido'
        },
        createdBy: order.user?.name || 'Usuario',
        status: order.status,
        createdAt: order.createdAt,
        total: order.items.reduce(
          (sum, item) => sum + Number(item.quantity * (item.product?.listPrice || 0)),
          0
        ),
        itemsCount: order.items.length,
        items: order.items.map(item => ({
          id: item.id,
          product: {
            sku: item.product?.sku,
            description: item.product?.description,
            price: item.product?.listPrice || 0
          },
          quantity: item.quantity,
          subtotal: item.quantity * (item.product?.listPrice || 0)
        }))
      }));

      res.json({
        orders: formattedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error al listar pedidos:', error);
      res.status(500).json({
        error: 'Error interno del servidor al listar pedidos'
      });
    }
  }

  /**
   * Obtener detalle de un pedido
   * GET /api/orders/:id
   */
  async getOrderDetail(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Verificar que el pedido exista
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  sku: true,
                  description: true,
                  listPrice: true,
                  currency: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Pedido no encontrado'
        });
      }

      // Validar permisos para ver este pedido (versión simplificada)
      if (!user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // ADMIN, CAPTURISTA, SUPER_ADMIN tienen acceso a todo
      if (['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN'].includes(user.role)) {
        // Acceso permitido
      } else if (user.role === 'PROMOTER') {
        // PROMOTER: solo sus propios pedidos
        if (order.userId !== user.id) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este pedido' });
        }
      } else if (user.role === 'SUPERVISOR') {
        // SUPERVISOR: pedidos de sus promotores
        const promoter = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { supervisorId: true }
        });

        if (!promoter || promoter.supervisorId !== user.id) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este pedido' });
        }
      } else if (user.role === 'VIEWER') {
        // VIEWER: solo lectura de pedidos de sus promotores
        const promoter = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { supervisorId: true }
        });

        if (!promoter || promoter.supervisorId !== user.id) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este pedido' });
        }
      } else {
        return res.status(403).json({ error: 'No tienes permisos para acceder a este pedido' });
      }

      // Formatear respuesta con información detallada para el frontend
      const formattedOrder = {
        id: order.id,
        client: {
          id: order.user?.id || '0',
          name: order.user?.name || 'Usuario desconocido'
        },
        createdBy: order.user?.name || 'Usuario',
        status: order.status,
        intelisisFolio: order.intelisisFolio,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        total: order.items.reduce((sum, item) => {
          return sum + (item.product.listPrice ? item.product.listPrice * item.quantity : 0);
        }, 0),
        items: order.items.map(item => ({
          id: item.id,
          product: {
            sku: item.product?.sku,
            description: item.product?.description,
            price: item.product?.listPrice || 0
          },
          quantity: item.quantity,
          subtotal: item.quantity * (item.product?.listPrice || 0)
        }))
      };

      res.json(formattedOrder);
    } catch (error) {
      console.error('Error al obtener detalle de pedido:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener detalle de pedido'
      });
    }
  }

  /**
   * Finalizar pedido (marcar como CAPTURED)
   * PATCH /api/orders/:id/complete
   */
  async completeOrder(req, res) {
    try {
      const { id } = req.params;
      const { intelisisFolio } = req.body;
      const user = req.user;

      // Validar que solo ADMIN, CAPTURISTA o SUPER_ADMIN puedan finalizar pedidos
      const allowedRoles = ['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'No tienes permisos para finalizar pedidos'
        });
      }

      // Validar intelisisFolio
      if (!intelisisFolio || intelisisFolio.trim() === '') {
        return res.status(400).json({
          error: 'El folio de Intelisis es requerido'
        });
      }

      // Verificar que el pedido exista
      const order = await prisma.order.findUnique({
        where: { id }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido esté en estado PENDING
      if (order.status !== 'PENDING') {
        return res.status(400).json({
          error: `El pedido ya está en estado ${order.status}`
        });
      }

      // Actualizar pedido
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'CAPTURED',
          intelisisFolio: intelisisFolio.trim()
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Pedido finalizado exitosamente',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Error al finalizar pedido:', error);
      res.status(500).json({
        error: 'Error interno del servidor al finalizar pedido'
      });
    }
  }

  /**
   * Cancelar pedido (marcar como CANCELLED)
   * PATCH /api/orders/:id/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Validar que solo ADMIN, CAPTURISTA o SUPER_ADMIN puedan cancelar pedidos
      const allowedRoles = ['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'No tienes permisos para cancelar pedidos'
        });
      }

      // Verificar que el pedido exista
      const order = await prisma.order.findUnique({
        where: { id }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido esté en estado PENDING
      if (order.status !== 'PENDING') {
        return res.status(400).json({
          error: `Solo se pueden cancelar pedidos en estado PENDING. El pedido actual está en estado ${order.status}`
        });
      }

      // Actualizar pedido
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Pedido cancelado exitosamente',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      res.status(500).json({
        error: 'Error interno del servidor al cancelar pedido'
      });
    }
  }

  /**
   * Validar acceso a un pedido según rol
   * @private
   */
  async validateOrderAccess(user, order) {
    if (!user) {
      throw new AuthorizationError('Usuario no autenticado', 401);
    }

    // ADMIN, CAPTURISTA, SUPER_ADMIN tienen acceso a todo
    if (['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN'].includes(user.role)) {
      return true;
    }

    // PROMOTER: solo sus propios pedidos
    if (user.role === 'PROMOTER') {
      if (order.userId !== user.id) {
        throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
      }
      return true;
    }

    // SUPERVISOR: pedidos de sus promotores
    if (user.role === 'SUPERVISOR') {
      const promoter = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { supervisorId: true }
      });

      if (!promoter || promoter.supervisorId !== user.id) {
        throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
      }
      return true;
    }

    // VIEWER: solo lectura de pedidos de sus promotores
    if (user.role === 'VIEWER') {
      const promoter = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { supervisorId: true }
      });

      if (!promoter || promoter.supervisorId !== user.id) {
        throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
      }
      return true;
    }

    throw new AuthorizationError('No tienes permisos para acceder a este pedido', 403);
  }

}

module.exports = new OrderController();
