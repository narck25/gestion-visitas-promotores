const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

/**
 * Función para inicializar Prisma (generar cliente y aplicar migraciones)
 * Esta función debe ejecutarse al iniciar la aplicación en producción
 */
const initializePrisma = () => {
  try {
    logger.info('Inicializando Prisma...');
    
    // 1. Generar cliente Prisma
    logger.info('Generando cliente Prisma...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    logger.info('✅ Cliente Prisma generado exitosamente');
    
    // 2. Aplicar migraciones
    logger.info('Aplicando migraciones de base de datos...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    logger.info('✅ Migraciones aplicadas exitosamente');
    
    return true;
  } catch (error) {
    logger.error('Error inicializando Prisma:', {
      error: error.message,
      code: error.code,
      signal: error.signal
    });
    
    // Verificar si es un error de migración que ya existe
    if (error.message.includes('already applied') || error.message.includes('No migrations found')) {
      logger.warn('Migraciones ya aplicadas o no encontradas, continuando...');
      return true;
    }
    
    // Verificar si es un error de conexión a base de datos
    if (error.message.includes('Connection') || error.message.includes('database')) {
      logger.error('Error de conexión a base de datos. Verifique DATABASE_URL');
      return false;
    }
    
    return false;
  }
};

/**
 * Función para inicializar el usuario administrador global
 * Crea el usuario admin si no existe
 */
const initializeAdminUser = async (prisma) => {
  try {
    const adminEmail = 'sistemas@kram.mx';
    const adminPassword = 'Sit3masKr4m2026';
    
    logger.info('Verificando existencia de usuario administrador...');
    
    // Verificar si el admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      logger.info('✅ Usuario administrador ya existe', {
        email: adminEmail,
        role: existingAdmin.role,
        id: existingAdmin.id
      });
      
      // Verificar si el admin tiene el rol correcto
      if (existingAdmin.role !== 'ADMIN' && existingAdmin.role !== 'SUPER_ADMIN') {
        logger.info('Actualizando rol del usuario administrador a ADMIN...');
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        });
        logger.info('✅ Rol del usuario administrador actualizado a ADMIN');
      }
      
      return true;
    }
    
    // Crear el admin si no existe
    logger.info('Creando usuario administrador...');
    
    // Validar y obtener salt rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    if (isNaN(saltRounds) || saltRounds < 1 || saltRounds > 20) {
      throw new Error('Configuración de seguridad inválida: BCRYPT_SALT_ROUNDS');
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Crear usuario admin
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador del Sistema',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    logger.info('✅ Usuario administrador creado exitosamente', {
      email: adminEmail,
      role: adminUser.role,
      id: adminUser.id
    });
    
    return true;
  } catch (error) {
    logger.error('Error inicializando usuario administrador:', {
      error: error.message,
      code: error.code
    });
    
    // No lanzar error para no bloquear el inicio de la aplicación
    return false;
  }
};

/**
 * Función para verificar estado de la base de datos
 */
const checkDatabaseStatus = async (prisma) => {
  try {
    // Intentar una consulta simple para verificar conexión y tablas
    const result = await prisma.$queryRaw`SELECT 1 as status`;
    
    // Verificar si la tabla User existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      ) as user_table_exists
    `;
    
    const userTableExists = tableExists[0]?.user_table_exists || false;
    
    logger.info('Estado de base de datos:', {
      connected: true,
      userTableExists,
      status: 'healthy'
    });
    
    return {
      connected: true,
      userTableExists,
      healthy: true,
      message: 'Base de datos conectada y lista'
    };
  } catch (error) {
    logger.error('Error verificando estado de base de datos:', {
      error: error.message,
      code: error.code
    });
    
    // Determinar tipo de error
    let errorType = 'unknown';
    let message = 'Error desconocido';
    
    if (error.code && error.code.startsWith('P')) {
      if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1003') {
        errorType = 'connection';
        message = 'No se puede conectar al servidor de base de datos';
      } else if (error.code === 'P2021' || error.code === 'P2010') {
        errorType = 'migration';
        message = 'Tablas de base de datos no existen';
      }
    }
    
    return {
      connected: false,
      userTableExists: false,
      healthy: false,
      errorType,
      message,
      error: error.message
    };
  }
};

/**
 * Función para inicializar base de datos con reintentos
 */
const initializeDatabaseWithRetry = async (prisma, maxRetries = 3, delayMs = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Intento ${attempt}/${maxRetries} de conectar a base de datos...`);
      
      // Verificar estado de la base de datos
      const status = await checkDatabaseStatus(prisma);
      
      if (status.connected && status.userTableExists) {
        logger.info('✅ Base de datos conectada y tablas existentes');
        
        // Inicializar usuario administrador después de verificar conexión
        try {
          await initializeAdminUser(prisma);
        } catch (adminError) {
          logger.warn('Error inicializando usuario administrador, continuando...', {
            error: adminError.message
          });
        }
        
        return { success: true, status };
      }
      
      if (!status.userTableExists) {
        logger.warn('Tabla User no existe, intentando aplicar migraciones...');
        
        // En producción, no ejecutamos migraciones automáticamente
        // Solo informamos al usuario
        if (process.env.NODE_ENV === 'production') {
          logger.error('❌ Tablas de base de datos no existen en producción');
          logger.info('ℹ️  Ejecute en el contenedor: npx prisma migrate deploy');
          return { 
            success: false, 
            status,
            message: 'Tablas no existen. Ejecute migraciones manualmente.' 
          };
        } else {
          // En desarrollo, intentar aplicar migraciones
          const migrationSuccess = initializePrisma();
          if (migrationSuccess) {
            logger.info('✅ Migraciones aplicadas exitosamente');
            
            // Inicializar usuario administrador después de aplicar migraciones
            try {
              await initializeAdminUser(prisma);
            } catch (adminError) {
              logger.warn('Error inicializando usuario administrador, continuando...', {
                error: adminError.message
              });
            }
            
            return { success: true, status: { ...status, userTableExists: true } };
          }
        }
      }
      
      if (attempt < maxRetries) {
        logger.info(`Esperando ${delayMs/1000} segundos antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      logger.error(`Error en intento ${attempt}:`, { error: error.message });
      
      if (attempt < maxRetries) {
        logger.info(`Esperando ${delayMs/1000} segundos antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  logger.error(`❌ No se pudo conectar a la base de datos después de ${maxRetries} intentos`);
  return { 
    success: false, 
    status: { 
      connected: false, 
      userTableExists: false, 
      healthy: false,
      message: 'Falló conexión después de múltiples intentos'
    } 
  };
};

module.exports = {
  initializePrisma,
  checkDatabaseStatus,
  initializeDatabaseWithRetry,
  initializeAdminUser
};
