const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireRoles } = require('../middleware/permissions');

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido
 * @access  Private (PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN)
 */
router.post('/', 
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
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }
    next();
  },
  orderController.listOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener detalle de un pedido
 * @access  Private (según permisos)
 */
router.get('/:id', 
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }
    next();
  },
  orderController.getOrderDetail
);

/**
 * @route   PATCH /api/orders/:id/complete
 * @desc    Finalizar pedido (marcar como CAPTURED)
 * @access  Private (ADMIN, CAPTURISTA, SUPER_ADMIN)
 */
router.patch('/:id/complete', 
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

module.exports = router;