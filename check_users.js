const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Consultando usuarios...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      },
      take: 10
    });
    
    console.log('Usuarios encontrados:', users.length);
    console.log('\nLista de usuarios:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Rol: ${user.role} - Activo: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();