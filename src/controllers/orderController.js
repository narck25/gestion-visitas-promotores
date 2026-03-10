const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { AuthorizationError, validateResourceOwnership } = require('../middleware/permissions');

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
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'El pedido debe contener al menos un producto'
        });
      }

      // Validar estructura de items
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          return res.status(400).json({
            error: 'Cada item debe tener productId y quantity'
          });
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({
            error: 'La cantidad debe ser un número positivo'
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
          error: 'Algunos productos no existen',
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
      if (status && ['PENDING', 'CAPTURED'].includes(status)) {
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
                    description: true
                  }
                }
              }
            }
          }
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        orders,
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

      // Validar permisos para ver este pedido
      try {
        await this.validateOrderAccess(user, order);
      } catch (authError) {
        return res.status(authError.statusCode || 403).json({
          error: authError.message
        });
      }

      // Formatear respuesta con información detallada
      const formattedOrder = {
        id: order.id,
        userId: order.userId,
        userName: order.user.name,
        userEmail: order.user.email,
        status: order.status,
        intelisisFolio: order.intelisisFolio,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          sku: item.product.sku,
          description: item.product.description,
          quantity: item.quantity,
          listPrice: item.product.listPrice,
          currency: item.product.currency,
          subtotal: item.product.listPrice ? item.product.listPrice * item.quantity : null
        })),
        total: order.items.reduce((sum, item) => {
          return sum + (item.product.listPrice ? item.product.listPrice * item.quantity : 0);
        }, 0)
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