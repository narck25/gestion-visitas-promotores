const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const supervisorController = require('../controllers/supervisorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validaciones para query parameters
const getPromotersValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim()
];

const getClientsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('promoterId').optional().isString()
];

const getVisitsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('promoterId').optional().isString(),
  query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

// Validaciones para asignar promotor
const assignPromoterValidation = [
  body('promoterId').notEmpty().isString()
];

/**
 * @route   GET /api/supervisor/promoters
 * @desc    Obtener todos los promotores asignados a un supervisor
 * @access  Private (SUPERVISOR)
 */
router.get('/promoters', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  getPromotersValidation, 
  supervisorController.getPromoters
);

/**
 * @route   GET /api/supervisor/clients
 * @desc    Obtener todos los clientes de los promotores asignados a un supervisor
 * @access  Private (SUPERVISOR)
 */
router.get('/clients', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  getClientsValidation, 
  supervisorController.getClients
);

/**
 * @route   GET /api/supervisor/visits
 * @desc    Obtener todas las visitas de los promotores asignados a un supervisor
 * @access  Private (SUPERVISOR)
 */
router.get('/visits', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  getVisitsValidation, 
  supervisorController.getVisits
);

/**
 * @route   GET /api/supervisor/stats
 * @desc    Obtener estadísticas de supervisión
 * @access  Private (SUPERVISOR)
 */
router.get('/stats', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  supervisorController.getSupervisorStats
);

/**
 * @route   POST /api/supervisor/promoters/assign
 * @desc    Asignar un promotor a un supervisor
 * @access  Private (SUPERVISOR)
 */
router.post('/promoters/assign', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  assignPromoterValidation, 
  supervisorController.assignPromoter
);

/**
 * @route   DELETE /api/supervisor/promoters/:promoterId/unassign
 * @desc    Desasignar un promotor de un supervisor
 * @access  Private (SUPERVISOR)
 */
router.delete('/promoters/:promoterId/unassign', 
  authenticateToken, 
  authorizeRoles('SUPERVISOR'), 
  supervisorController.unassignPromoter
);

module.exports = router;