const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireRoles } = require('../middleware/permissions');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido
 * @access  Private (PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN)
 */
router.post('/', 
  authenticateToken,
  (req, res, next) => {
    try {
      requireRoles(req.user, ['PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);
      next();
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        error: error.message
      });
    }
  },
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Listar pedidos según permisos
 * @access  Private (todos los roles autenticados)
 */
router.get('/', 
  authenticateToken,
  orderController.listOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener detalle de un pedido
 * @access  Private (según permisos)
 */
router.get('/:id', 
  authenticateToken,
  orderController.getOrderDetail
);

/**
 * @route   PATCH /api/orders/:id/complete
 * @desc    Finalizar pedido (marcar como CAPTURED)
 * @access  Private (ADMIN, CAPTURISTA, SUPER_ADMIN)
 */
router.patch('/:id/complete', 
  authenticateToken,
  (req, res, next) => {
    try {
      requireRoles(req.user, ['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN']);
      next();
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        error: error.message
      });
    }
  },
  orderController.completeOrder
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancelar pedido (marcar como CANCELLED)
 * @access  Private (ADMIN, CAPTURISTA, SUPER_ADMIN)
 */
router.patch('/:id/cancel', 
  authenticateToken,
  (req, res, next) => {
    try {
      requireRoles(req.user, ['ADMIN', 'CAPTURISTA', 'SUPER_ADMIN']);
      next();
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        error: error.message
      });
    }
  },
  orderController.cancelOrder
);

module.exports = router;
