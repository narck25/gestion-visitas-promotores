const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');

// Configurar directorio de uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware para validar que el usuario es un promotor
const isPromoter = (req, res, next) => {
  if (req.user.role !== 'PROMOTER') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo los promotores pueden registrar visitas.'
    });
  }
  next();
};

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempId = 'temp_' + Date.now();
    const userDir = path.join(uploadDir, `user_${req.user.id}`, `visit_${tempId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    
    cb(null, filename);
  }
});

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: fileFilter
});

const uploadVisitImages = upload.fields([
  { name: 'beforePhotos', maxCount: 5 },
  { name: 'afterPhotos', maxCount: 5 }
]);

// Función para generar URL
const generateFileUrl = (userId, visitId, filename) => {
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${baseUrl}/uploads/user_${userId}/visit_${visitId}/${filename}`;
};

// POST /api/visits/images - Registrar visita con imágenes
router.post('/', authenticateToken, isPromoter, (req, res, next) => {
  uploadVisitImages(req, res, async (err) => {
    if (err) {
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
      
      return res.status(400).json({
        success: false,
        message: `Error al subir archivos: ${err.message}`
      });
    }
    
    try {
      const { clientId, latitude, longitude, notes, purpose, rating } = req.body;
      const promoterId = req.user.id;

      // Validaciones básicas
      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del cliente es requerido'
        });
      }

      if (!notes || notes.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Las notas de la visita son requeridas'
        });
      }

      // Verificar que el cliente existe
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Procesar archivos subidos
      const files = req.files || {};
      const beforePhotos = files.beforePhotos || [];
      const afterPhotos = files.afterPhotos || [];

      // Validar que haya al menos una foto
      if (beforePhotos.length === 0 && afterPhotos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere al menos una foto (antes o después)'
        });
      }

      // Crear la visita
      const visit = await prisma.visit.create({
        data: {
          promoterId,
          clientId,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          notes: notes.trim(),
          purpose: purpose || 'SALES',
          rating: rating ? parseInt(rating) : null,
          status: 'COMPLETED',
          date: new Date()
        }
      });

      // Procesar fotos ANTES
      const beforePhotoRecords = [];
      for (const file of beforePhotos) {
        const fileUrl = generateFileUrl(promoterId, visit.id, file.filename);
        
        const photo = await prisma.photo.create({
          data: {
            visitId: visit.id,
            url: fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            type: 'BEFORE',
            caption: `Foto ANTES - ${file.originalname}`,
            takenAt: new Date()
          }
        });
        
        beforePhotoRecords.push(photo);
      }

      // Procesar fotos DESPUÉS
      const afterPhotoRecords = [];
      for (const file of afterPhotos) {
        const fileUrl = generateFileUrl(promoterId, visit.id, file.filename);
        
        const photo = await prisma.photo.create({
          data: {
            visitId: visit.id,
            url: fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            type: 'AFTER',
            caption: `Foto DESPUÉS - ${file.originalname}`,
            takenAt: new Date()
          }
        });
        
        afterPhotoRecords.push(photo);
      }

      // Obtener visita completa
      const visitWithPhotos = await prisma.visit.findUnique({
        where: { id: visit.id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              businessName: true,
              phone: true
            }
          },
          beforePhotos: {
            select: {
              id: true,
              url: true,
              fileName: true,
              type: true,
              caption: true
            }
          },
          afterPhotos: {
            select: {
              id: true,
              url: true,
              fileName: true,
              type: true,
              caption: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Visita registrada exitosamente con imágenes',
        data: {
          visit: visitWithPhotos,
          stats: {
            beforePhotos: beforePhotoRecords.length,
            afterPhotos: afterPhotoRecords.length,
            totalPhotos: beforePhotoRecords.length + afterPhotoRecords.length
          }
        }
      });

    } catch (error) {
      next(error);
    }
  });
});

// GET /api/visits/images/:id - Obtener visita con imágenes
router.get('/:id', authenticateToken, isPromoter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoterId = req.user.id;

    const visit = await prisma.visit.findFirst({
      where: {
        id,
        promoterId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            businessName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true
          }
        },
        beforePhotos: {
          select: {
            id: true,
            url: true,
            fileName: true,
            fileSize: true,
            type: true,
            caption: true,
            takenAt: true
          }
        },
        afterPhotos: {
          select: {
            id: true,
            url: true,
            fileName: true,
            fileSize: true,
            type: true,
            caption: true,
            takenAt: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: { visit }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;