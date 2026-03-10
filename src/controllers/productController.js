const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controlador para búsqueda de productos (autocomplete)
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    // Validar que se proporcione un término de búsqueda
    if (!q || q.trim() === '') {
      return res.status(400).json({
        error: 'Se requiere un término de búsqueda (parámetro q)'
      });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: {
        description: 'asc'
      },
      select: {
        id: true,
        sku: true,
        description: true,
        family: true,
        line: true,
        manufacturer: true,
        listPrice: true,
        currency: true
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor al buscar productos'
    });
  }
};

/**
 * Obtener un producto por ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        description: true,
        family: true,
        line: true,
        manufacturer: true,
        listPrice: true,
        currency: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener producto'
    });
  }
};

/**
 * Obtener todos los productos (con paginación)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { family: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          description: 'asc'
        },
        select: {
          id: true,
          sku: true,
          description: true,
          family: true,
          line: true,
          manufacturer: true,
          listPrice: true,
          currency: true
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener productos'
    });
  }
};