const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validaciones para registro
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
];

// Validaciones para login
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Validaciones para refresh token
const refreshTokenValidation = [
  body('refreshToken').notEmpty()
];

// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('avatar').optional().trim()
];

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refrescar token de acceso
 * @access  Public
 */
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);

module.exports = router;
