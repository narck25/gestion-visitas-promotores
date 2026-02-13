const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware para verificar que el usuario es ADMIN o SUPER_ADMIN
const requireAdmin = authorizeRoles('ADMIN', 'SUPER_ADMIN');

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/', authenticateToken, requireAdmin, usersController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.get('/:id', authenticateToken, requireAdmin, usersController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Crear un nuevo usuario (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.post('/', authenticateToken, requireAdmin, usersController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.put('/:id', authenticateToken, requireAdmin, usersController.updateUser);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Cambiar estado de usuario (activar/desactivar) (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.patch('/:id/status', authenticateToken, requireAdmin, usersController.updateUserStatus);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar usuario (borrado lógico) (solo admin)
 * @access  Private (Admin/Super Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, usersController.deleteUser);

module.exports = router;