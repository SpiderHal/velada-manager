const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password123', // En producción usar bcrypt
      role: 'ADMIN',
    },
  });
  console.log('Created admin user');

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
