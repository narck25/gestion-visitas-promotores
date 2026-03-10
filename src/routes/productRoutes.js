const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @route   GET /api/products/search
 * @desc    Buscar productos para autocomplete
 * @access  Public
 */
router.get('/search', productController.searchProducts);

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con paginación
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto por ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

module.exports = router;