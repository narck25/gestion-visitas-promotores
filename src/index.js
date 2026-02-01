const app = require('./config/app');
const prisma = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Manejo de cierre elegante
    const gracefulShutdown = async () => {
      console.log('\n🛑 Recibida señal de apagado...');

      // Cerrar servidor
      server.close(async () => {
        console.log('✅ Servidor HTTP cerrado');

        // Cerrar conexión a la base de datos
        await prisma.$disconnect();
        console.log('✅ Conexión a base de datos cerrada');

        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre después de timeout');
        process.exit(1);
      }, 10000);
    };

    // Manejar señales de terminación
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Iniciar aplicación
startServer();