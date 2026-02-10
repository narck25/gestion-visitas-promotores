const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar que el usuario es admin o super admin
const requireAdmin = authorizeRoles('ADMIN', 'SUPER_ADMIN');

/**
 * @route   GET /api/admin/users
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);

/**
 * @route   GET /api/admin/clients
 * @desc    Obtener todos los clientes (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/clients', authenticateToken, requireAdmin, adminController.getAllClients);

/**
 * @route   GET /api/admin/visits
 * @desc    Obtener todas las visitas (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/visits', authenticateToken, requireAdmin, adminController.getAllVisits);

/**
 * @route   GET /api/admin/stats
 * @desc    Obtener estadísticas del sistema (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/stats', authenticateToken, requireAdmin, adminController.getSystemStats);

/**
 * @route   PATCH /api/admin/users/:userId/role
 * @desc    Actualizar rol de usuario (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.patch('/users/:userId/role', authenticateToken, requireAdmin, adminController.updateUserRole);

/**
 * @route   PATCH /api/admin/users/:userId/status
 * @desc    Activar/desactivar usuario (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.patch('/users/:userId/status', authenticateToken, requireAdmin, adminController.toggleUserStatus);

module.exports = router;