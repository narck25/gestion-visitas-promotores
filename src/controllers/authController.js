const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateTokens } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * Controlador para registro de usuarios
 */
const register = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { email, password, name, role } = req.body;

    logger.info(`[${requestId}] Iniciando registro de usuario`, { 
      email: email ? `${email.substring(0, 3)}...` : 'no-provided',
      hasName: !!name,
      hasPassword: !!password,
      role: role || 'default'
    });

    // Validar campos requeridos con mensajes específicos
    const validationErrors = [];
    
    if (!email || email.trim() === '') {
      validationErrors.push('Email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Email no tiene formato válido');
    }
    
    if (!password || password.trim() === '') {
      validationErrors.push('Contraseña es requerida');
    } else if (password.length < 6) {
      validationErrors.push('Contraseña debe tener al menos 6 caracteres');
    }
    
    if (!name || name.trim() === '') {
      validationErrors.push('Nombre es requerido');
    }

    if (validationErrors.length > 0) {
      logger.warn(`[${requestId}] Validación fallida`, { errors: validationErrors });
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: validationErrors
      });
    }

    // Verificar si el usuario ya existe
    logger.info(`[${requestId}] Verificando si usuario existe`, { email: `${email.substring(0, 3)}...` });
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logger.warn(`[${requestId}] Usuario ya existe`, { email: `${email.substring(0, 3)}...` });
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Validar y obtener salt rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    if (isNaN(saltRounds) || saltRounds < 1 || saltRounds > 20) {
      logger.error(`[${requestId}] BCRYPT_SALT_ROUNDS inválido`, { 
        value: process.env.BCRYPT_SALT_ROUNDS,
        parsed: saltRounds 
      });
      throw new Error('Configuración de seguridad inválida');
    }

    // Hash de la contraseña
    logger.info(`[${requestId}] Generando hash de contraseña`, { saltRounds });
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario con valores por defecto según esquema Prisma
    logger.info(`[${requestId}] Creando usuario en base de datos`);
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        name: name.trim(),
        role: (role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROMOTER', 'VIEWER'].includes(role)) 
          ? role 
          : 'PROMOTER',
        isActive: true, // Valor por defecto según esquema
        // createdAt y updatedAt se generan automáticamente
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Generar tokens
    logger.info(`[${requestId}] Generando tokens JWT`);
    const tokens = generateTokens(user.id);

    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    });

    const duration = Date.now() - startTime;
    logger.info(`[${requestId}] Registro exitoso`, { 
      userId: user.id,
      role: user.role,
      duration: `${duration}ms`
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        tokens
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log detallado del error
    logger.error(`[${requestId}] Error en registro`, {
      error: error.message,
      stack: error.stack,
      code: error.code,
      duration: `${duration}ms`,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasRefreshSecret: !!process.env.REFRESH_TOKEN_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS
      }
    });

    // Manejar errores específicos de Prisma
    if (error.code && error.code.startsWith('P')) {
      if (error.code === 'P2002') {
        // Violación de constraint único (email duplicado)
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
      
      if (error.code === 'P2025') {
        // Registro no encontrado (en relaciones)
        return res.status(400).json({
          success: false,
          message: 'Error en datos de referencia'
        });
      }
      
      if (error.code === 'P2003') {
        // Violación de foreign key
        return res.status(400).json({
          success: false,
          message: 'Error en relación de datos'
        });
      }
      
      if (error.code === 'P2021' || error.code === 'P2010') {
        // Tabla no existe o error de migración
        logger.error(`[${requestId}] Error de migración de base de datos`, {
          code: error.code,
          message: error.message,
          meta: error.meta
        });
        
        return res.status(503).json({
          success: false,
          message: 'Base de datos no inicializada',
          error: 'Las tablas de la base de datos no existen',
          solution: 'Ejecute migraciones: npx prisma migrate deploy',
          documentation: 'Ver PRISMA_MIGRATION_GUIDE.md para instrucciones'
        });
      }
      
      if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1003') {
        // Error de conexión a base de datos
        return res.status(503).json({
          success: false,
          message: 'Error de conexión a base de datos',
          error: 'No se puede conectar al servidor de base de datos',
          solution: 'Verifique DATABASE_URL y que PostgreSQL esté ejecutándose'
        });
      }
    }

    // Error de bcrypt
    if (error.message.includes('bcrypt') || error.message.includes('salt')) {
      return res.status(500).json({
        success: false,
        message: 'Error en configuración de seguridad'
      });
    }

    // Error de JWT
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return res.status(500).json({
        success: false,
        message: 'Error en configuración de autenticación'
      });
    }

    // Error genérico
    next(error);
  }
};

/**
 * Controlador para login de usuarios
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar tokens
    const tokens = generateTokens(user.id);

    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token en la base de datos
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    // Verificar expiración
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id }
      });
      return res.status(403).json({
        success: false,
        message: 'Refresh token expirado'
      });
    }

    // Verificar que el usuario esté activo
    if (!tokenRecord.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Generar nuevos tokens
    const newTokens = generateTokens(tokenRecord.user.id);

    // Eliminar refresh token antiguo
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id }
    });

    // Guardar nuevo refresh token
    await prisma.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        userId: tokenRecord.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    });

    res.status(200).json({
      success: true,
      message: 'Tokens actualizados',
      data: {
        tokens: newTokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Eliminar refresh token de la base de datos
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obtener perfil de usuario
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar perfil de usuario
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, avatar } = req.body;

    // Validar que al menos un campo sea proporcionado
    if (!name && !phone && !avatar) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar (name, phone, avatar)'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede estar vacío'
        });
      }
      updateData.name = name.trim();
    }
    
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar ? avatar.trim() : null;
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile
};
