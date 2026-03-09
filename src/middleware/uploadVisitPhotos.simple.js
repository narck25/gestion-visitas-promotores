const multer = require("multer");
const path = require("path");

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/visits");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// Crear instancia de multer
const multerInstance = multer({ storage });

// Middleware simple para manejar cualquier archivo
const uploadAnyFiles = (req, res, next) => {
  multerInstance.any()(req, res, (err) => {
    if (err) {
      console.error("Error en middleware de upload:", err);
      return res.status(400).json({
        success: false,
        message: "Error subiendo archivos"
      });
    }
    next();
  });
};

module.exports = uploadAnyFiles;