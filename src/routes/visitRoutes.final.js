const router = require("express").Router();

const authenticateToken = require("../middleware/auth");
const { 
  createVisit, 
  getVisits, 
  getVisitById, 
  updateVisit, 
  deleteVisit, 
  getVisitStats 
} = require("../controllers/visitController.refactored");

/**
 * @route POST /api/visits
 * @desc Crear una nueva visita (sin fotos por ahora)
 * @access Private (Autenticado)
 */
router.post(
  "/",
  authenticateToken,
  createVisit
);

/**
 * @route GET /api/visits
 * @desc Obtener todas las visitas (con paginación y filtros)
 * @access Private (Autenticado)
 */
router.get(
  "/",
  authenticateToken,
  getVisits
);

/**
 * @route GET /api/visits/:id
 * @desc Obtener una visita específica por ID
 * @access Private (Autenticado)
 */
router.get(
  "/:id",
  authenticateToken,
  getVisitById
);

/**
 * @route PUT /api/visits/:id
 * @desc Actualizar una visita (solo notas y coordenadas)
 * @access Private (Autenticado)
 */
router.put(
  "/:id",
  authenticateToken,
  updateVisit
);

/**
 * @route DELETE /api/visits/:id
 * @desc Eliminar una visita
 * @access Private (Autenticado)
 */
router.delete(
  "/:id",
  authenticateToken,
  deleteVisit
);

/**
 * @route GET /api/visits/stats
 * @desc Obtener estadísticas de visitas
 * @access Private (Autenticado)
 */
router.get(
  "/stats",
  authenticateToken,
  getVisitStats
);

module.exports = router;