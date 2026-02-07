import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Normalize phone number by removing all non-digit characters
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalize all existing phone numbers in the database
 */
async function normalizeExistingPhones() {
  console.log('Starting phone number normalization...\n');

  try {
    // Normalize technician phone numbers
    const technicians = await prisma.technician.findMany();
    console.log(`Found ${technicians.length} technicians`);

    for (const tech of technicians) {
      const normalizedPhone = normalizePhone(tech.phone);
      if (normalizedPhone !== tech.phone) {
        await prisma.technician.update({
          where: { id: tech.id },
          data: { phone: normalizedPhone }
        });
        console.log(`✓ Updated technician ${tech.name}: "${tech.phone}" -> "${normalizedPhone}"`);
      }
    }

    // Normalize customer phone numbers (array field)
    const customers = await prisma.customer.findMany();
    console.log(`\nFound ${customers.length} customers`);

    for (const customer of customers) {
      if (Array.isArray(customer.phone) && customer.phone.length > 0) {
        const normalizedPhones = customer.phone.map(p => normalizePhone(p));
        const hasChanges = normalizedPhones.some((np, idx) => np !== customer.phone[idx]);
        
        if (hasChanges) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { phone: normalizedPhones }
          });
          console.log(`✓ Updated customer ${customer.name}:`);
          console.log(`  Before: [${customer.phone.join(', ')}]`);
          console.log(`  After:  [${normalizedPhones.join(', ')}]`);
        }
      }
    }

    console.log('\n✅ Phone normalization completed successfully!');
  } catch (error) {
    console.error('❌ Error during normalization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the normalization
normalizeExistingPhones()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
