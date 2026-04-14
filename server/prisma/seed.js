const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Limpiar administradores anteriores (opcional, para evitar duplicidad)
  await prisma.user.deleteMany({
    where: { 
      username: { in: ['admin', 'Admin'] }
    }
  });

  // Create Admin User
  await prisma.user.create({
    data: {
      username: 'Admin',
      password: 'PC2220AMGC',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user: Admin / PC2220AMGC');

  for (let i = 1; i <= 40; i++) {
    const table = await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        seats: {
          create: Array.from({ length: 10 }, (_, j) => ({
            seatNumber: j + 1,
            status: 'AVAILABLE',
          })),
        },
      },
    });
    console.log(`Created table ${table.number}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
