import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createFirebaseUser, deleteFirebaseUser } from '../lib/firebase-admin.js';
import { normalizePhone } from '../lib/phoneUtils.js';
import { sendTechnicianWelcomeEmail } from '../lib/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        picture: true,
        leadsTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single technician by ID
router.get('/:id', async (req, res) => {
  try {
    const technician = await prisma.technician.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        leadsTeam: true,
      },
    });

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Don't send password to client
    const { password, ...technicianWithoutPassword } = technician;

    res.status(200).json(technicianWithoutPassword);
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new technician
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, picture } = req.body;

    // Normalize phone number (remove dashes, spaces, etc.)
    const normalizedPhone = normalizePhone(phone);

    // Generate default password: "DTG" + last 4 digits of phone
    // If no phone, use random 4 digits
    let defaultPassword;
    if (normalizedPhone && normalizedPhone.length >= 4) {
      defaultPassword = `DTG${normalizedPhone.slice(-4)}`;
    } else {
      defaultPassword = `DTG${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create technician in database
    const technician = await prisma.technician.create({
      data: {
        name,
        email,
        phone: normalizedPhone,
        picture: picture || '',
        password: hashedPassword, // Store hashed password
      },
    });

    // Create Firebase Auth user with the same credentials
    try {
      await createFirebaseUser(email, defaultPassword, name);
      console.log(`✅ Created Firebase Auth user for: ${email}`);
    } catch (firebaseError) {
      console.error(`⚠️  Failed to create Firebase user for ${email}:`, firebaseError.message);
      // Continue anyway - they can run sync script later
    }

    // Send welcome email with credentials
    let emailSent = false;
    try {
      const emailResult = await sendTechnicianWelcomeEmail({
        to: email,
        name,
        password: defaultPassword,
        email,
      });
      emailSent = emailResult.success;
    } catch (emailError) {
      console.error(`⚠️  Failed to send welcome email to ${email}:`, emailError.message);
      // Continue anyway - admin can share password manually
    }

    // Return technician without password, but include default password in response for admin to share
    const { password, ...technicianData } = technician;

    res.status(201).json({
      ...technicianData,
      defaultPassword, // Only sent once on creation
      emailSent,
      message: emailSent 
        ? `Technician created. Welcome email sent to ${email}`
        : 'Technician created. Share this password with them: ' + defaultPassword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a technician by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, picture } = req.body;

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    const technician = await prisma.technician.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        email,
        phone: normalizedPhone,
        picture,
      },
    });

    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a technician by ID
router.delete('/:id', async (req, res) => {
  try {
    // Get technician email before deleting (for Firebase cleanup)
    const technician = await prisma.technician.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Delete from database
    await prisma.technician.delete({
      where: { id: parseInt(req.params.id) },
    });

    // Delete from Firebase Auth
    try {
      await deleteFirebaseUser(technician.email);
      console.log(`✅ Deleted Firebase Auth user: ${technician.email}`);
    } catch (firebaseError) {
      console.error(`⚠️  Failed to delete Firebase user ${technician.email}:`, firebaseError.message);
      // Continue anyway - deletion from DB is more important
    }

    res.status(200).json({ message: 'Technician deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
