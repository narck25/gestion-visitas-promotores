const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validaciones para crear cliente
const createClientValidation = [
  body('name').notEmpty().isString().trim(),
  body('phone').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().isString().trim(),
  body('businessType').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  body('promoterId').optional().isString()
];

// Validaciones para actualizar cliente
const updateClientValidation = [
  body('name').optional().isString().trim(),
  body('phone').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().isString().trim(),
  body('businessType').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  body('promoterId').optional().isString()
];

// Validaciones para query parameters
const getClientsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('promoterId').optional().isString()
];

/**
 * @route   GET /api/clients
 * @desc    Obtener todos los clientes (con filtros por rol)
 * @access  Private (Todos los roles autenticados)
 */
router.get('/', 
  authenticateToken, 
  getClientsValidation, 
  clientController.getAllClients
);

/**
 * @route   GET /api/clients/stats
 * @desc    Obtener estadísticas de clientes
 * @access  Private (Todos los roles autenticados)
 */
router.get('/stats', 
  authenticateToken, 
  clientController.getClientStats
);

/**
 * @route   POST /api/clients
 * @desc    Crear un nuevo cliente
 * @access  Private (PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN)
 */
router.post('/', 
  authenticateToken, 
  authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'), 
  createClientValidation, 
  clientController.createClient
);

/**
 * @route   GET /api/clients/:id
 * @desc    Obtener un cliente específico
 * @access  Private (Todos los roles autenticados con permisos)
 */
router.get('/:id', 
  authenticateToken, 
  clientController.getClientById
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Actualizar un cliente
 * @access  Private (PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN)
 */
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'), 
  updateClientValidation, 
  clientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Eliminar un cliente
 * @access  Private (PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN)
 */
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'), 
  clientController.deleteClient
);

module.exports = router;