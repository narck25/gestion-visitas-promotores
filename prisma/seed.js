const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos de ejemplo para ciudades mexicanas
const cities = [
  'Ciudad de México',
  'Guadalajara',
  'Monterrey',
  'Puebla',
  'Tijuana',
  'León',
  'Querétaro',
  'Mérida',
  'Cancún',
  'Acapulco'
];

// Tipos de negocio
const businessTypes = ['RETAIL', 'WHOLESALE', 'SERVICE', 'MANUFACTURING', 'FOOD', 'OTHER'];

// Propósitos de visita
const visitPurposes = ['SALES', 'FOLLOW_UP', 'DELIVERY', 'TRAINING', 'COMPLAINT', 'OTHER'];

// Estados de visita
const visitStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

// Nombres de negocios realistas
const businessNames = [
  'Supermercado La Esperanza',
  'Farmacias del Ahorro',
  'Tienda de Abarrotes Don José',
  'Restaurante El Mexicano',
  'Papelería y Regalos',
  'Taller Mecánico Rápido',
  'Lavandería Express',
  'Cafetería Central',
  'Ferretería El Constructor',
  'Mueblería Moderna',
  'Óptica Visión Clara',
  'Veterinaria Mascotas Felices',
  'Florería Primavera',
  'Panadería El Buen Pan',
  'Carnicería La Especial'
];

// Notas de visita realistas
const visitNotes = [
  'Cliente satisfecho con el producto, mostró interés en nueva línea',
  'Se realizó entrega de pedido pendiente, todo en orden',
  'Cliente reportó problema con producto anterior, se gestionó garantía',
  'Capacitación sobre uso correcto del equipo',
  'Seguimiento a venta anterior, cliente considera ampliar pedido',
  'Visita de cortesía, relación comercial en buen estado',
  'Presentación de nuevos catálogos y promociones',
  'Reunión para definir pedido del próximo mes',
  'Resolución de queja, cliente quedó satisfecho',
  'Evaluación de necesidades para propuesta personalizada'
];

// URLs de ejemplo para fotos
const photoUrls = [
  'https://example.com/photos/visit1-before.jpg',
  'https://example.com/photos/visit1-after.jpg',
  'https://example.com/photos/visit2-before.jpg',
  'https://example.com/photos/visit2-after.jpg',
  'https://example.com/photos/visit3-before.jpg',
  'https://example.com/photos/visit3-after.jpg'
];

// Función para generar fecha aleatoria en los últimos 30 días
function getRandomDate() {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

// Función para generar fecha futura (para visitas programadas)
function getFutureDate() {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  return futureDate;
}

// Función para generar coordenadas aleatorias en México
function getRandomCoordinates() {
  // Coordenadas aproximadas de México
  const latMin = 14.5;
  const latMax = 32.5;
  const lngMin = -118.4;
  const lngMax = -86.7;
  
  const latitude = latMin + Math.random() * (latMax - latMin);
  const longitude = lngMin + Math.random() * (lngMax - lngMin);
  
  return {
    latitude: parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6)),
    accuracy: parseFloat((5 + Math.random() * 15).toFixed(2)) // 5-20 metros de precisión
  };
}

// Función para generar dirección realista
function getRandomAddress(city) {
  const streets = ['Av. Principal', 'Calle Reforma', 'Blvd. Insurgentes', 'Calle Juárez', 'Av. Hidalgo'];
  const numbers = Math.floor(Math.random() * 1000) + 1;
  const colonias = ['Centro', 'Del Valle', 'Nápoles', 'Polanco', 'Condesa', 'Roma'];
  
  return `${streets[Math.floor(Math.random() * streets.length)]} ${numbers}, Col. ${colonias[Math.floor(Math.random() * colonias.length)]}, ${city}`;
}

// Función para generar teléfono mexicano
function getRandomPhone() {
  const areaCodes = ['55', '81', '33', '656', '664', '222', '477', '442', '449', '871'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `+52${areaCode}${number}`;
}

// Función para generar email basado en nombre
function getEmailFromName(name) {
  const cleanName = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, '.');
  return `${cleanName}@empresa.com`;
}

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');
  
  try {
    // 1. Limpieza previa en orden correcto
    console.log('🧹 Limpiando datos existentes...');
    
    await prisma.refreshToken.deleteMany();
    console.log('  ✓ RefreshTokens eliminados');
    
    await prisma.orderItem.deleteMany();
    console.log('  ✓ OrderItems eliminados');
    
    await prisma.order.deleteMany();
    console.log('  ✓ Orders eliminados');
    
    await prisma.visit.deleteMany();
    console.log('  ✓ Visitas eliminadas');
    
    await prisma.client.deleteMany();
    console.log('  ✓ Clientes eliminados');
    
    await prisma.user.deleteMany();
    console.log('  ✓ Usuarios eliminados');
    
    // 2. Crear usuarios con jerarquía
    console.log('👥 Creando usuarios...');
    
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // SUPER_ADMIN
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@empresa.com',
        password: passwordHash,
        name: 'Super Administrador',
        phone: '+5215512345678',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    console.log(`  ✓ SUPER_ADMIN creado: ${superAdmin.email}`);
    
    // ADMIN
    const admin = await prisma.user.create({
      data: {
        email: 'admin@empresa.com',
        password: passwordHash,
        name: 'Administrador General',
        phone: '+5215512345679',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log(`  ✓ ADMIN creado: ${admin.email}`);
    
    // SUPERVISORES (2)
    const supervisors = [];
    for (let i = 1; i <= 2; i++) {
      const supervisor = await prisma.user.create({
        data: {
          email: `supervisor${i}@empresa.com`,
          password: passwordHash,
          name: `Supervisor ${i}`,
          phone: getRandomPhone(),
          role: 'SUPERVISOR',
          isActive: true
        }
      });
      supervisors.push(supervisor);
      console.log(`  ✓ SUPERVISOR ${i} creado: ${supervisor.email}`);
    }
    
    // PROMOTORES (4) - 2 por cada supervisor
    const promoters = [];
    let promoterCount = 1;
    
    for (const supervisor of supervisors) {
      for (let j = 1; j <= 2; j++) {
        const promoter = await prisma.user.create({
          data: {
            email: `promotor${promoterCount}@empresa.com`,
            password: passwordHash,
            name: `Promotor ${promoterCount}`,
            phone: getRandomPhone(),
            role: 'PROMOTER',
            supervisorId: supervisor.id,
            isActive: true
          }
        });
        promoters.push(promoter);
        console.log(`  ✓ PROMOTER ${promoterCount} creado: ${promoter.email} (Supervisor: ${supervisor.name})`);
        promoterCount++;
      }
    }
    
    // 3. Crear clientes (5 por cada promotor)
    console.log('🏢 Creando clientes...');
    const clients = [];
    let clientCount = 1;
    
    for (const promoter of promoters) {
      for (let k = 1; k <= 5; k++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
        const businessName = businessNames[Math.floor(Math.random() * businessNames.length)];
        const clientName = `Cliente ${clientCount}`;
        
        const client = await prisma.client.create({
          data: {
            name: clientName,
            businessName: businessName,
            phone: getRandomPhone(),
            email: getEmailFromName(clientName),
            address: getRandomAddress(city),
            city: city,
            state: 'Estado',
            country: 'México',
            postalCode: Math.floor(10000 + Math.random() * 90000).toString(),
            businessType: businessType,
            category: 'General',
            notes: `Cliente desde ${new Date().getFullYear() - Math.floor(Math.random() * 5)}`,
            promoterId: promoter.id,
            isActive: true
          }
        });
        
        clients.push({ ...client, promoterId: promoter.id });
        console.log(`  ✓ Cliente ${clientCount} creado: ${client.businessName || client.name} (Promotor: ${promoter.name})`);
        clientCount++;
      }
    }
    
    // 4. Crear visitas (3-6 por cada cliente)
    console.log('📋 Creando visitas...');
    let visitCount = 1;
    
    for (const client of clients) {
      const numVisits = 3 + Math.floor(Math.random() * 4); // 3-6 visitas
      
      for (let l = 1; l <= numVisits; l++) {
        const status = visitStatuses[Math.floor(Math.random() * visitStatuses.length)];
        const purpose = visitPurposes[Math.floor(Math.random() * visitPurposes.length)];
        const notes = visitNotes[Math.floor(Math.random() * visitNotes.length)];
        const coordinates = getRandomCoordinates();
        
        // Para visitas programadas, usar fecha futura
        const isScheduled = status === 'SCHEDULED' || status === 'IN_PROGRESS';
        const visitDate = isScheduled ? getFutureDate() : getRandomDate();
        
        // Número aleatorio de fotos (0-3)
        const numBeforePhotos = Math.floor(Math.random() * 4);
        const numAfterPhotos = Math.floor(Math.random() * 4);
        
        const beforePhotos = Array.from({ length: numBeforePhotos }, (_, i) => 
          photoUrls[Math.floor(Math.random() * photoUrls.length)]
        );
        
        const afterPhotos = Array.from({ length: numAfterPhotos }, (_, i) => 
          photoUrls[Math.floor(Math.random() * photoUrls.length)]
        );
        
        await prisma.visit.create({
          data: {
            promoterId: client.promoterId,
            clientId: client.id,
            date: visitDate,
            scheduledDate: isScheduled ? visitDate : null,
            duration: 30 + Math.floor(Math.random() * 120), // 30-150 minutos
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: getRandomAddress(client.city || 'Ciudad de México'),
            accuracy: coordinates.accuracy,
            status: status,
            purpose: purpose,
            notes: notes,
            rating: status === 'COMPLETED' ? 4 + Math.floor(Math.random() * 2) : null, // 4-5 si completada
            beforePhotos: beforePhotos,
            afterPhotos: afterPhotos,
            signature: status === 'COMPLETED' ? `firma_${visitCount}.png` : null,
            signedAt: status === 'COMPLETED' ? visitDate : null,
            isSynced: true
          }
        });
        
        console.log(`  ✓ Visita ${visitCount} creada: ${status} - ${purpose} (Cliente: ${client.businessName || client.name})`);
        visitCount++;
      }
    }
    
    // 5. Crear pedidos de prueba usando productos existentes
    console.log('📦 Creando pedidos de prueba...');
    
    // Obtener productos existentes
    const products = await prisma.product.findMany({
      take: 20
    });
    
    let orderCount = 1;
    
    for (const promoter of promoters) {
      const numberOfOrders = 2 + Math.floor(Math.random() * 3); // 2-4 pedidos por promotor
      
      for (let i = 0; i < numberOfOrders; i++) {
        const status = Math.random() > 0.5 ? 'PENDING' : 'CAPTURED';
        
        const randomProducts = products
          .sort(() => 0.5 - Math.random())
          .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 productos por pedido
        
        const order = await prisma.order.create({
          data: {
            userId: promoter.id,
            status: status,
            intelisisFolio: status === 'CAPTURED'
              ? `INT-${1000 + orderCount}`
              : null,
            items: {
              create: randomProducts.map(product => ({
                productId: product.id,
                quantity: 1 + Math.floor(Math.random() * 20) // 1-20 unidades
              }))
            }
          }
        });
        
        console.log(`  ✓ Pedido ${orderCount} creado (${status}) - Promotor: ${promoter.name}`);
        orderCount++;
      }
    }
    
    console.log(`📦 ${orderCount - 1} pedidos creados`);
    
    // 6. Resumen final
    console.log('\n✅ Seed completado exitosamente!');
    console.log('📊 Resumen de datos creados:');
    console.log(`   👤 Usuarios: 1 SUPER_ADMIN, 1 ADMIN, 2 SUPERVISOR, 4 PROMOTER`);
    console.log(`   🏢 Clientes: ${clients.length} (5 por cada promotor)`);
    console.log(`   📋 Visitas: ${visitCount - 1} (3-6 por cada cliente)`);
    console.log(`   📦 Pedidos: ${orderCount - 1} (2-4 por cada promotor)`);
    console.log('\n🔑 Credenciales para login:');
    console.log('   Email: cualquier usuario creado (ej: promotor1@empresa.com)');
    console.log('   Password: 123456');
    console.log('\n💡 Puedes iniciar sesión con cualquier promotor y ver sus visitas en "Mis visitas"');
    console.log('💡 Los pedidos de prueba están disponibles en el módulo de pedidos');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
main()
  .then(() => {
    console.log('🎉 Seed ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal en seed:', error);
    process.exit(1);
  });