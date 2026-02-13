const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * Controlador para obtener todos los usuarios (solo ADMIN)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', isActive = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER'].includes(role)) {
      where.role = role;
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Obtener usuarios con paginación
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              visits: true,
              clients: true,
              promoters: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener un usuario por ID (solo ADMIN)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        promoters: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        _count: {
          select: {
            visits: true,
            clients: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para crear un nuevo usuario (solo ADMIN)
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, name, phone, avatar, role, supervisorId } = req.body;

    // Validar campos requeridos
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña, nombre y rol son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido'
      });
    }

    // Validar rol
    if (!['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        avatar: avatar || null,
        role,
        supervisorId: supervisorId || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info('Usuario creado', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar un usuario (solo ADMIN)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name, phone, avatar, role, supervisorId } = req.body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validar email único si se está cambiando
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }
    }

    // Validar rol si se está cambiando
    if (role && !['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido'
      });
    }

    // Validar que no sea el último admin
    if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      if (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN') {
        const adminCount = await prisma.user.count({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ],
            id: { not: id }
          }
        });

        if (adminCount === 0) {
          return res.status(400).json({
            success: false,
            error: 'No se puede eliminar el último administrador del sistema'
          });
        }
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: email || existingUser.email,
        name: name || existingUser.name,
        phone: phone !== undefined ? phone : existingUser.phone,
        avatar: avatar !== undefined ? avatar : existingUser.avatar,
        role: role || existingUser.role,
        supervisorId: supervisorId !== undefined ? supervisorId : existingUser.supervisorId
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('Usuario actualizado', {
      userId: id,
      updatedBy: req.user.id,
      changes: { email, name, role }
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    next(error);
  }
};

/**
 * Controlador para cambiar estado de usuario (activar/desactivar) (solo ADMIN)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validar que isActive sea booleano
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo isActive debe ser booleano'
      });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validar que no sea el último admin activo
    if (isActive === false) {
      if (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN') {
        const activeAdminCount = await prisma.user.count({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ],
            isActive: true,
            id: { not: id }
          }
        });

        if (activeAdminCount === 0) {
          return res.status(400).json({
            success: false,
            error: 'No se puede desactivar el último administrador activo del sistema'
          });
        }
      }
    }

    // Actualizar estado del usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('Estado de usuario actualizado', {
      userId: id,
      newStatus: isActive,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    next(error);
  }
};

/**
 * Controlador para eliminar usuario (borrado lógico) (solo ADMIN)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validar que no sea el último admin activo
    if (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'SUPER_ADMIN' }
          ],
          isActive: true,
          id: { not: id }
        }
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar el último administrador activo del sistema'
        });
      }
    }

    // Borrado lógico: desactivar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('Usuario desactivado (borrado lógico)', {
      userId: id,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
};