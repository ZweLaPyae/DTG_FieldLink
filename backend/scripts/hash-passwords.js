import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Hash all existing plain text passwords in the database
 * This script should be run once after implementing password hashing
 */
async function hashExistingPasswords() {
  console.log('Starting password hashing migration...\n');

  try {
    // Get all technicians with passwords
    const technicians = await prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    console.log(`Found ${technicians.length} technicians\n`);

    let hashedCount = 0;
    let skippedCount = 0;
    let nullCount = 0;

    for (const tech of technicians) {
      // Skip if password is null
      if (!tech.password) {
        console.log(`⚠ Skipped ${tech.name} (${tech.email}) - Password is null`);
        nullCount++;
        continue;
      }

      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (tech.password.startsWith('$2a$') || tech.password.startsWith('$2b$') || tech.password.startsWith('$2y$')) {
        console.log(`⏭ Skipped ${tech.name} (${tech.email}) - Already hashed`);
        skippedCount++;
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(tech.password, 10);

      // Update in database
      await prisma.technician.update({
        where: { id: tech.id },
        data: { password: hashedPassword },
      });

      console.log(`✓ Hashed password for ${tech.name} (${tech.email})`);
      console.log(`  Plain: ${tech.password} -> Hashed: ${hashedPassword.substring(0, 20)}...`);
      hashedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  ✓ Hashed: ${hashedCount}`);
    console.log(`  ⏭ Already hashed: ${skippedCount}`);
    console.log(`  ⚠ Null passwords: ${nullCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ Password hashing migration completed successfully!');

    if (nullCount > 0) {
      console.log('\n⚠️  Warning: Some technicians have null passwords.');
      console.log('   They will not be able to log in until passwords are set.');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
hashExistingPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
