const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@dtgfieldlink.com';
  const password = process.env.ADMIN_PASSWORD || 'password';
  const name = process.env.ADMIN_NAME || 'Administrator';
  const role = process.env.ADMIN_ROLE || 'admin';

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role,
    },
    create: {
      email,
      passwordHash,
      name,
      role,
    },
  });

  console.log(`Seeded admin user with email ${email}`);
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
