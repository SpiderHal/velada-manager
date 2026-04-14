const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Limpiar usuarios anteriores para evitar duplicidad
  await prisma.user.deleteMany({
    where: { 
      username: { in: ['admin', 'Admin', 'Adri', 'Vendedor'] }
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

  // Create Standard User (Adri)
  await prisma.user.create({
    data: {
      username: 'Adri',
      password: 'Adri/AMgc.2023',
      role: 'USER',
    },
  });
  console.log('Created standard user: Adri / Adri/AMgc.2023');

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
