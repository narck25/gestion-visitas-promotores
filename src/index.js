require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./config/app');
const prisma = require('./config/database');
const logger = require('./config/logger');
const { initializeDatabaseWithRetry } = require('./config/prismaInit');

const PORT = process.env.PORT || 3001;

// Estado de la aplicación
let isShuttingDown = false;
let server = null;

// Validar variables de entorno críticas para autenticación
const validateEnvVariables = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'DATABASE_URL',
    'BCRYPT_SALT_ROUNDS'
  ];

  const recommendedEnvVars = [
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN'
  ];

  const missingVars = [];
  const invalidVars = [];
  const warningVars = [];

  // Validar variables requeridas
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      // Validaciones específicas
      if (varName === 'BCRYPT_SALT_ROUNDS') {
        const saltRounds = parseInt(value);
        if (isNaN(saltRounds) || saltRounds < 1 || saltRounds > 20) {
          invalidVars.push(`${varName}=${value} (debe ser número entre 1-20)`);
        }
      }
      
      if (varName === 'JWT_SECRET' || varName === 'REFRESH_TOKEN_SECRET') {
        if (value.includes('change-this') || value.length < 32) {
          invalidVars.push(`${varName} (debe tener al menos 32 caracteres y ser único)`);
        }
      }
    }
  });

  // Validar variables recomendadas
  recommendedEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      warningVars.push(varName);
    } else {
      // Validar formato de expiración
      const isValidFormat = /^(\d+[smhd]?|\d+)$/.test(value);
      if (!isValidFormat) {
        warningVars.push(`${varName}=${value} (formato inválido, usar ej: "15m", "1h", "7d")`);
      }
    }
  });

  if (missingVars.length > 0 || invalidVars.length > 0) {
    const errorMessage = [
      '❌ ERROR: Variables de entorno inválidas o faltantes:',
      ...missingVars.map(v => `  - ${v}: NO DEFINIDA`),
      ...invalidVars.map(v => `  - ${v}: VALOR INVÁLIDO`),
      '',
      'Para producción, asegúrate de configurar:',
      '  JWT_SECRET=tu-secreto-jwt-seguro-minimo-32-caracteres',
      '  REFRESH_TOKEN_SECRET=tu-secreto-refresh-seguro-minimo-32-caracteres',
      '  DATABASE_URL=postgresql://usuario:contraseña@host:5432/basedatos',
      '  BCRYPT_SALT_ROUNDS=10 (número entre 1-20)',
      '',
      'Variables recomendadas (usarán valores por defecto si faltan):',
      '  JWT_EXPIRES_IN=15m (ej: 15m, 1h, 24h)',
      '  REFRESH_TOKEN_EXPIRES_IN=7d (ej: 7d, 30d)',
      '',
      'En Coolify, configura estas variables en Environment Variables.'
    ].join('\n');

    logger.error(errorMessage);
    throw new Error('Variables de entorno inválidas');
  }

  // Mostrar advertencias para variables recomendadas
  if (warningVars.length > 0) {
    logger.warn('⚠️  Variables de entorno recomendadas no configuradas o inválidas:', {
      warnings: warningVars,
      defaults: {
        JWT_EXPIRES_IN: '15m',
        REFRESH_TOKEN_EXPIRES_IN: '7d'
      }
    });
    logger.info('ℹ️  Se usarán valores por defecto para expiración de tokens');
  }

  logger.info('✅ Variables de entorno críticas validadas correctamente');
};

// Inicialización de storage para Coolify - rutas ABSOLUTAS
const initStorage = () => {
  // Directorios requeridos por Coolify Directory Mounts
  const requiredDirs = [
    '/app/uploads',    // Archivos subidos por usuarios
    '/app/tmp',        // Archivos temporales
    '/app/logs'        // Logs de la aplicación
  ];

  logger.info('Inicializando storage para Coolify...');

  requiredDirs.forEach(dirPath => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`✅ Directorio creado: ${dirPath}`);
      } else {
        logger.info(`✅ Directorio ya existe: ${dirPath}`);
      }
    } catch (error) {
      // NO cerramos el proceso si falla la creación de directorios
      logger.warn(`⚠️  No se pudo crear/verificar directorio ${dirPath}:`, { 
        error: error.message,
        code: error.code 
      });
      logger.info(`ℹ️  El servidor continuará funcionando sin el directorio ${dirPath}`);
    }
  });

  logger.info('✅ Inicialización de storage completada');
};

// Verificar estado de directorios (para healthcheck)
const checkStorageHealth = () => {
  const requiredDirs = ['/app/uploads', '/app/tmp', '/app/logs'];
  const status = {
    healthy: true,
    directories: {}
  };

  requiredDirs.forEach(dirPath => {
    try {
      const exists = fs.existsSync(dirPath);
      const writable = exists ? (() => {
        try {
          // Intentar escribir un archivo temporal para verificar permisos
          const testFile = path.join(dirPath, `.test-${Date.now()}`);
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          return true;
        } catch {
          return false;
        }
      })() : false;

      status.directories[dirPath] = {
        exists,
        writable,
        path: dirPath
      };

      if (!exists || !writable) {
        status.healthy = false;
      }
    } catch (error) {
      status.directories[dirPath] = {
        exists: false,
        writable: false,
        error: error.message,
        path: dirPath
      };
      status.healthy = false;
    }
  });

  return status;
};

// Función para iniciar el servidor con inicialización de base de datos
const startServer = async () => {
  try {
    // 1. Validar variables de entorno críticas
    validateEnvVariables();

    // 2. Inicializar storage para Coolify (rutas ABSOLUTAS)
    initStorage();

    // 3. Inicializar base de datos con reintentos (no bloqueante)
    logger.info('Inicializando conexión a base de datos...');
    const dbInitResult = await initializeDatabaseWithRetry(prisma);
    
    if (!dbInitResult.success) {
      logger.warn('Base de datos no inicializada correctamente:', {
        status: dbInitResult.status,
        message: dbInitResult.message
      });
      
      if (dbInitResult.status.errorType === 'migration') {
        logger.error('❌ ERROR CRÍTICO: Tablas de base de datos no existen');
        logger.info('ℹ️  Para producción en Coolify, ejecute antes de iniciar:');
        logger.info('    npx prisma migrate deploy');
        logger.info('ℹ️  O configure en Dockerfile:');
        logger.info('    RUN npx prisma generate && npx prisma migrate deploy');
      }
    } else {
      logger.info('✅ Base de datos inicializada correctamente');
    }

    // 4. Iniciar servidor HTTP (siempre se inicia, incluso sin DB)
    server = app.listen(PORT, '0.0.0.0', () => {
      const corsOrigins = process.env.CORS_ALLOWED_ORIGINS || 'https://app.prodevfabian.cloud,https://api.prodevfabian.cloud';
      const environment = process.env.NODE_ENV || 'production';
      
      // 5. Verificar estado de storage después de iniciar
      const storageStatus = checkStorageHealth();
      logger.info('Estado de storage:', { storageStatus });
      
      // 6. Log estado de base de datos
      logger.info('Estado de base de datos:', { 
        connected: dbInitResult.success,
        tablesExist: dbInitResult.success ? dbInitResult.status.userTableExists : false
      });
      
      // 7. Usar logger estructurado para inicio del servidor
      logger.serverStart(PORT, environment, corsOrigins);
      
      // 8. Mensaje importante para producción
      if (process.env.NODE_ENV === 'production' && !dbInitResult.success) {
        logger.warn('⚠️  ADVERTENCIA: Servidor iniciado SIN base de datos funcional');
        logger.info('ℹ️  Los endpoints de autenticación devolverán error 503');
        logger.info('ℹ️  Ejecute migraciones: npx prisma migrate deploy');
      }
    });

    // Manejo de cierre elegante mejorado
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      logger.info(`Recibida señal ${signal}, iniciando apagado elegante...`);
      
      // Cerrar servidor HTTP
      if (server) {
        server.close(async () => {
          logger.info('Servidor HTTP cerrado');
          
          // Cerrar conexión a la base de datos si está conectada
          try {
            await prisma.$disconnect();
            logger.info('Conexión a base de datos cerrada');
          } catch (error) {
            logger.warn('No se pudo cerrar conexión a DB:', { error: error.message });
          }
          
          logger.info('Apagado completado');
          process.exit(0);
        });
        
        // Forzar cierre después de 30 segundos (más tiempo para producción)
        setTimeout(() => {
          logger.error('Forzando cierre después de timeout de 30s');
          process.exit(1);
        }, 30000);
      } else {
        process.exit(0);
      }
    };

    // Manejar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Manejar señal de reinicio (para PM2/process managers)
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

    // Manejar errores no capturados sin derribar el proceso - MEJORADO
    process.on('uncaughtException', (error) => {
      logger.error('Error no capturado', error, { 
        type: 'uncaughtException',
        pid: process.pid 
      });
      // NO cerramos el proceso - mantenemos el servidor arriba
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promesa rechazada no manejada', null, { 
        reason: String(reason),
        type: 'unhandledRejection',
        pid: process.pid 
      });
      // NO cerramos el proceso - mantenemos el servidor arriba
    });

    // Manejar errores específicos de Prisma sin derribar el proceso
    process.on('beforeExit', async () => {
      if (!isShuttingDown) {
        try {
          await prisma.$disconnect();
        } catch (error) {
          // Ignorar errores al desconectar durante salida
        }
      }
    });

  } catch (error) {
    logger.error('Error crítico al iniciar el servidor', error);
    process.exit(1);
  }
};

// Iniciar aplicación
startServer();
