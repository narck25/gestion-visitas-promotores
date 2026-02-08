require('dotenv').config();
const app = require('./config/app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 3001;

// Estado de la aplicación
let isShuttingDown = false;
let server = null;

// Función para verificar conexión a la base de datos (no bloqueante)
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');
    return true;
  } catch (error) {
    console.warn('⚠️  No se pudo conectar a la base de datos:', error.message);
    console.log('ℹ️  El servidor continuará funcionando sin conexión a DB');
    return false;
  }
};

// Función para iniciar el servidor (no bloqueada por DB)
const startServer = () => {
  try {
    // Iniciar servidor inmediatamente
    server = app.listen(PORT, '0.0.0.0', () => {
      const host = '0.0.0.0';
      console.log(`🚀 Servidor ejecutándose en http://${host}:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🔗 Health check: http://${host}:${PORT}/health`);
      console.log(`🔗 Health check (liveness): http://${host}:${PORT}/health/liveness`);
      console.log(`🔗 Health check (readiness): http://${host}:${PORT}/health/readiness`);
    });

    // Intentar conectar a la base de datos en segundo plano
    setTimeout(async () => {
      await checkDatabaseConnection();
    }, 1000);

    // Manejo de cierre elegante mejorado
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      console.log(`\n🛑 Recibida señal ${signal}, iniciando apagado elegante...`);
      
      // Cerrar servidor HTTP
      if (server) {
        server.close(async () => {
          console.log('✅ Servidor HTTP cerrado');
          
          // Cerrar conexión a la base de datos si está conectada
          try {
            await prisma.$disconnect();
            console.log('✅ Conexión a base de datos cerrada');
          } catch (error) {
            console.log('ℹ️  No se pudo cerrar conexión a DB:', error.message);
          }
          
          console.log('👋 Apagado completado');
          process.exit(0);
        });
        
        // Forzar cierre después de 30 segundos (más tiempo para producción)
        setTimeout(() => {
          console.error('❌ Forzando cierre después de timeout de 30s');
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

    // Manejar errores no capturados sin derribar el proceso
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error.message);
      console.error('Stack:', error.stack);
      // No llamamos a gracefulShutdown para mantener el servidor arriba
      // Solo registramos el error
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      // No llamamos a gracefulShutdown para mantener el servidor arriba
      // Solo registramos el error
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
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar aplicación
startServer();
