const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const visitController = require('../controllers/visitController');
const { authenticateToken } = require('../middleware/auth');

// Validaciones para crear visita
const createVisitValidation = [
  body('clientId').notEmpty().isString(),
  body('notes').notEmpty().isString(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('address').optional().isString(),
  body('photos').optional().isArray(),
  body('signature').optional().isString(),
  body('date').optional().isISO8601()
];

// Validaciones para actualizar visita
const updateVisitValidation = [
  body('notes').optional().isString(),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  body('photos').optional().isArray(),
  body('signature').optional().isString(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('address').optional().isString()
];

// Validaciones para query parameters
const getVisitsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('promoterId').optional().isString()
];

/**
 * @route   POST /api/visits
 * @desc    Crear una nueva visita
 * @access  Private (Promotor)
 */
router.post('/', authenticateToken, createVisitValidation, visitController.createVisit);

/**
 * @route   GET /api/visits
 * @desc    Obtener todas las visitas del promotor (con paginación)
 * @access  Private (Promotor)
 */
router.get('/', authenticateToken, getVisitsValidation, visitController.getVisits);

/**
 * @route   GET /api/visits/stats
 * @desc    Obtener estadísticas de visitas
 * @access  Private (Promotor)
 */
router.get('/stats', authenticateToken, visitController.getVisitStats);

/**
 * @route   GET /api/visits/:id
 * @desc    Obtener una visita específica
 * @access  Private (Promotor)
 */
router.get('/:id', authenticateToken, visitController.getVisitById);

/**
 * @route   PUT /api/visits/:id
 * @desc    Actualizar una visita
 * @access  Private (Promotor)
 */
router.put('/:id', authenticateToken, updateVisitValidation, visitController.updateVisit);

/**
 * @route   DELETE /api/visits/:id
 * @desc    Eliminar una visita
 * @access  Private (Promotor)
 */
router.delete('/:id', authenticateToken, visitController.deleteVisit);

module.exports = router;