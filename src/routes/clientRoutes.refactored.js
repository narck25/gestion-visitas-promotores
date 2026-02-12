const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController.refactored');
const clientValidators = require('../validators/clientValidator');
const { rateLimitMiddleware } = require('../middleware/rateLimit/rateLimiter');
const { authenticate, authorize } = require('../middleware/auth');

// Aplicar rate limiting a todas las rutas de clientes
router.use(rateLimitMiddleware.api);

/**
 * @route   GET /api/clients
 * @desc    Obtener todos los clientes con filtros por rol
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER, VIEWER)
 */
router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER']),
  clientValidators.filterRequest,
  clientController.getAllClients
);

/**
 * @route   POST /api/clients
 * @desc    Crear nuevo cliente
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER)
 */
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER']),
  rateLimitMiddleware.create,
  clientValidators.createRequest,
  clientController.createClient
);

/**
 * @route   GET /api/clients/stats
 * @desc    Obtener estadísticas de clientes
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER, VIEWER)
 */
router.get(
  '/stats',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER']),
  clientValidators.statsFilterRequest,
  clientController.getClientStats
);

/**
 * @route   GET /api/clients/:id
 * @desc    Obtener cliente por ID
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER, VIEWER)
 */
router.get(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER']),
  clientValidators.idRequest,
  clientController.getClientById
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Actualizar cliente
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER']),
  rateLimitMiddleware.create,
  clientValidators.idRequest,
  clientValidators.updateRequest,
  clientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Eliminar cliente (soft delete por defecto)
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER']),
  rateLimitMiddleware.create,
  clientValidators.idRequest,
  clientController.deleteClient
);

/**
 * @route   PATCH /api/clients/:id/restore
 * @desc    Restaurar cliente (soft delete revertido)
 * @access  Private (ADMIN, SUPERVISOR)
 */
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR']),
  clientValidators.idRequest,
  clientController.restoreClient
);

/**
 * @route   GET /api/clients/promoter/:promoterId
 * @desc    Obtener clientes por promotor
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER)
 */
router.get(
  '/promoter/:promoterId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER']),
  clientValidators.filterRequest,
  clientController.getClientsByPromoter
);

/**
 * @route   GET /api/clients/supervisor/:supervisorId
 * @desc    Obtener clientes por supervisor
 * @access  Private (ADMIN, SUPERVISOR)
 */
router.get(
  '/supervisor/:supervisorId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR']),
  clientValidators.filterRequest,
  clientController.getClientsBySupervisor
);

/**
 * @route   GET /api/clients/:id/exists
 * @desc    Verificar si cliente existe
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER, VIEWER)
 */
router.get(
  '/:id/exists',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER']),
  clientValidators.idRequest,
  clientController.clientExists
);

/**
 * @route   GET /api/clients/:id/belongs
 * @desc    Verificar si cliente pertenece al usuario
 * @access  Private (ADMIN, SUPERVISOR, PROMOTER, VIEWER)
 */
router.get(
  '/:id/belongs',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER']),
  clientValidators.idRequest,
  clientController.clientBelongsToUser
);

module.exports = router;