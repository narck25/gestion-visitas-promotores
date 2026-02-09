const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Adjuntar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Validar y obtener valores seguros para expiración de tokens
 */
const validateTokenExpirations = () => {
  // Valores por defecto seguros
  const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = "15m";  // 15 minutos
  const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = "7d";  // 7 días
  
  // Validar JWT_EXPIRES_IN
  let accessTokenExpiresIn = process.env.JWT_EXPIRES_IN;
  if (!accessTokenExpiresIn || accessTokenExpiresIn.trim() === '') {
    console.warn(`JWT_EXPIRES_IN no definido o vacío, usando valor por defecto: "${DEFAULT_ACCESS_TOKEN_EXPIRES_IN}"`);
    accessTokenExpiresIn = DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
  } else {
    // Validar formato (debe ser número de segundos o string timespan)
    const isValidFormat = /^(\d+[smhd]?|\d+)$/.test(accessTokenExpiresIn);
    if (!isValidFormat) {
      console.warn(`JWT_EXPIRES_IN tiene formato inválido: "${accessTokenExpiresIn}", usando valor por defecto: "${DEFAULT_ACCESS_TOKEN_EXPIRES_IN}"`);
      accessTokenExpiresIn = DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
    }
  }
  
  // Validar REFRESH_TOKEN_EXPIRES_IN
  let refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;
  if (!refreshTokenExpiresIn || refreshTokenExpiresIn.trim() === '') {
    console.warn(`REFRESH_TOKEN_EXPIRES_IN no definido o vacío, usando valor por defecto: "${DEFAULT_REFRESH_TOKEN_EXPIRES_IN}"`);
    refreshTokenExpiresIn = DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
  } else {
    // Validar formato
    const isValidFormat = /^(\d+[smhd]?|\d+)$/.test(refreshTokenExpiresIn);
    if (!isValidFormat) {
      console.warn(`REFRESH_TOKEN_EXPIRES_IN tiene formato inválido: "${refreshTokenExpiresIn}", usando valor por defecto: "${DEFAULT_REFRESH_TOKEN_EXPIRES_IN}"`);
      refreshTokenExpiresIn = DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
    }
  }
  
  return {
    accessTokenExpiresIn,
    refreshTokenExpiresIn
  };
};

/**
 * Middleware para generar tokens con validación robusta
 */
const generateTokens = (userId) => {
  // Validar variables de entorno críticas
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    throw new Error('JWT_SECRET no está configurado');
  }
  
  if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.trim() === '') {
    throw new Error('REFRESH_TOKEN_SECRET no está configurado');
  }
  
  // Obtener valores validados para expiración
  const { accessTokenExpiresIn, refreshTokenExpiresIn } = validateTokenExpirations();
  
  // Generar access token
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpiresIn }
  );

  // Generar refresh token
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: refreshTokenExpiresIn }
  );

  return { accessToken, refreshToken };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  generateTokens
};