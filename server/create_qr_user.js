const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { username: 'QR' },
      update: { 
        password: 'AMgc.2023',
        role: 'LECTOR'
      },
      create: {
        username: 'QR',
        password: 'AMgc.2023',
        role: 'LECTOR'
      },
    });
    console.log('Usuario QR creado/actualizado correctamente:', user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
