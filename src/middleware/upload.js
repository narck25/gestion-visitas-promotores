const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const visitId = req.body.visitId || 'temp';
    const userDir = path.join(uploadDir, `user_${req.user?.id || 'anonymous'}`, `visit_${visitId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    
    cb(null, filename);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite por archivo
    files: 10 // Máximo 10 archivos por petición
  },
  fileFilter: fileFilter
});

// Middleware para subir imágenes de visita (antes y después)
const uploadVisitImages = upload.fields([
  { name: 'beforePhotos', maxCount: 5 },
  { name: 'afterPhotos', maxCount: 5 }
]);

// Middleware para procesar errores de upload
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB por imagen.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. Máximo 5 imágenes por tipo (antes/después).'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo no esperado. Use "beforePhotos" o "afterPhotos".'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Error al subir archivos: ${err.message}`
    });
  } else if (err) {
    // Otros errores
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// Función para generar URL pública del archivo
const generateFileUrl = (req, filename) => {
  if (!req.user || !filename) return null;
  
  const visitId = req.body.visitId || 'temp';
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
  
  return `${baseUrl}/uploads/user_${req.user.id}/visit_${visitId}/${filename}`;
};

// Función para limpiar archivos temporales
const cleanupTempFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error al eliminar archivo temporal:', error);
      }
    }
  });
};

module.exports = {
  uploadVisitImages,
  handleUploadErrors,
  generateFileUrl,
  cleanupTempFiles,
  uploadDir
};