const prisma = require('../config/database');
const { generateFileUrl, cleanupTempFiles } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

/**
 * Controlador para registrar una visita con imágenes
 */
const createVisitWithImages = async (req, res, next) => {
  let tempFiles = []; // Para limpiar archivos en caso de error
  
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

    // Validar coordenadas si se proporcionan
    if (latitude && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Latitud inválida. Debe estar entre -90 y 90 grados.'
      });
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Longitud inválida. Debe estar entre -180 y 180 grados.'
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

    // Validar que haya al menos una foto (antes o después)
    if (beforePhotos.length === 0 && afterPhotos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una foto (antes o después)'
      });
    }

    // Crear la visita en la base de datos
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
      const fileUrl = generateFileUrl(req, file.filename);
      
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
      tempFiles.push(file.path);
    }

    // Procesar fotos DESPUÉS
    const afterPhotoRecords = [];
    for (const file of afterPhotos) {
      const fileUrl = generateFileUrl(req, file.filename);
      
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
      tempFiles.push(file.path);
    }

    // Actualizar la visita con las relaciones de fotos
    const updatedVisit = await prisma.visit.update({
      where: { id: visit.id },
      data: {
        beforePhotos: {
          connect: beforePhotoRecords.map(photo => ({ id: photo.id }))
        },
        afterPhotos: {
          connect: afterPhotoRecords.map(photo => ({ id: photo.id }))
        }
      },
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

    // Limpiar lista de archivos temporales (ya se guardaron correctamente)
    tempFiles = [];

    res.status(201).json({
      success: true,
      message: 'Visita registrada exitosamente con imágenes',
      data: {
        visit: updatedVisit,
        stats: {
          beforePhotos: beforePhotoRecords.length,
          afterPhotos: afterPhotoRecords.length,
          totalPhotos: beforePhotoRecords.length + afterPhotoRecords.length
        }
      }
    });

  } catch (error) {
    // Limpiar archivos temporales en caso de error
    if (tempFiles.length > 0) {
      cleanupTempFiles(tempFiles);
    }

    next(error);
  }
};

/**
 * Controlador para obtener una visita con sus imágenes
 */
const getVisitWithImages = async (req, res, next) => {
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
            thumbnailUrl: true,
            fileName: true,
            fileSize: true,
            type: true,
            caption: true,
            takenAt: true,
            createdAt: true
          }
        },
        afterPhotos: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            fileName: true,
            fileSize: true,
            type: true,
            caption: true,
            takenAt: true,
            createdAt: true
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
};

/**
 * Controlador para eliminar una foto específica
 */
const deletePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const promoterId = req.user.id;

    // Verificar que la foto existe y pertenece a una visita del promotor
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        visit: {
          promoterId
        }
      },
      include: {
        visit: {
          select: {
            id: true,
            promoterId: true
          }
        }
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada o no tienes permisos para eliminarla'
      });
    }

    // Extraer ruta del archivo de la URL
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const filePath = photo.url.replace(baseUrl, '').replace('/uploads', 'uploads');
    const absolutePath = path.join(__dirname, '../../', filePath);

    // Eliminar archivo físico si existe
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Eliminar registro de la base de datos
    await prisma.photo.delete({
      where: { id: photoId }
    });

    res.status(200).json({
      success: true,
      message: 'Foto eliminada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para agregar fotos adicionales a una visita existente
 */
const addPhotosToVisit = async (req, res, next) => {
  let tempFiles = [];
  
  try {
    const { visitId } = req.params;
    const { type, caption } = req.body; // type: 'BEFORE' o 'AFTER'
    const promoterId = req.user.id;

    // Validar tipo de foto
    if (!type || !['BEFORE', 'AFTER'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de foto inválido. Use "BEFORE" o "AFTER".'
      });
    }

    // Verificar que la visita existe y pertenece al promotor
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        promoterId
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada o no tienes permisos'
      });
    }

    // Procesar archivos subidos
    const files = req.files || {};
    const photos = files.photos || [];

    if (photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron fotos'
      });
    }

    // Crear registros de fotos
    const photoRecords = [];
    for (const file of photos) {
      const fileUrl = generateFileUrl(req, file.filename);
      
      const photo = await prisma.photo.create({
        data: {
          visitId,
          url: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          type,
          caption: caption || `${type} - ${file.originalname}`,
          takenAt: new Date()
        }
      });
      
      photoRecords.push(photo);
      tempFiles.push(file.path);
    }

    // Conectar fotos a la visita
    const relationField = type === 'BEFORE' ? 'beforePhotos' : 'afterPhotos';
    await prisma.visit.update({
      where: { id: visitId },
      data: {
        [relationField]: {
          connect: photoRecords.map(photo => ({ id: photo.id }))
        }
      }
    });

    // Limpiar lista de archivos temporales
    tempFiles = [];

    res.status(201).json({
      success: true,
      message: `Fotos ${type.toLowerCase()} agregadas exitosamente`,
      data: {
        photos: photoRecords,
        count: photoRecords.length
      }
    });

  } catch (error) {
    // Limpiar archivos temporales en caso de error
    if (tempFiles.length > 0) {
      cleanupTempFiles(tempFiles);
    }
    
    next(error);
  }
};

module.exports = {
  createVisitWithImages,
  getVisitWithImages,
  deletePhoto,
  addPhotosToVisit
};