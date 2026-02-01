const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateTokens } = require('../middleware/auth');

/**
 * Controlador para registro de usuarios
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validar campos requeridos
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'PROMOTER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

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

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        tokens
      }
    });
  } catch (error) {
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

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};