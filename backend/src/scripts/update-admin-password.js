import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const newPassword = process.env.ADMIN_PASSWORD || 'password';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.adminUser.update({
      where: { email: 'dtg.fiber.maintenance@gmail.com' },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('✅ Admin password updated successfully!');
    console.log(`Email: dtg.fiber.maintenance@gmail.com`);
    console.log(`Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
