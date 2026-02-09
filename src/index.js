require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./config/app');
const prisma = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

// Estado de la aplicación
let isShuttingDown = false;
let server = null;

// Crear directorios necesarios si no existen
const createRequiredDirectories = () => {
  const directories = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../tmp'),
    path.join(__dirname, '../../logs')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Directorio creado: ${dir}`);
      } catch (error) {
        logger.warn(`No se pudo crear directorio ${dir}:`, { error: error.message });
      }
    }
  });
};

// Función para verificar conexión a la base de datos (no bloqueante)
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Conectado a la base de datos PostgreSQL');
    return true;
  } catch (error) {
    logger.warn('No se pudo conectar a la base de datos:', { error: error.message });
    logger.info('El servidor continuará funcionando sin conexión a DB');
    return false;
  }
};

// Función para iniciar el servidor (no bloqueada por DB)
const startServer = () => {
  try {
    // Crear directorios necesarios
    createRequiredDirectories();

    // Iniciar servidor inmediatamente
    server = app.listen(PORT, '0.0.0.0', () => {
      const corsOrigins = process.env.CORS_ALLOWED_ORIGINS || 'https://app.prodevfabian.cloud,https://api.prodevfabian.cloud';
      const environment = process.env.NODE_ENV || 'production';
      
      // Usar logger estructurado para inicio del servidor
      logger.serverStart(PORT, environment, corsOrigins);
    });

    // Intentar conectar a la base de datos en segundo plano
    setTimeout(async () => {
      await checkDatabaseConnection();
    }, 1000);

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
