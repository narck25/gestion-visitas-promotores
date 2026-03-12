const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/products/search
 * @desc    Buscar productos para autocomplete
 * @access  Public
 */
router.get('/search', productController.searchProducts);

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con paginación
 * @access  Private (todos los roles autenticados)
 */
router.get('/', authenticateToken, productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto por ID
 * @access  Private (todos los roles autenticados)
 */
router.get('/:id', authenticateToken, productController.getProductById);

module.exports = router;
