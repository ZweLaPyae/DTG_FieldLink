import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createFirebaseUser, deleteFirebaseUser } from '../lib/firebase-admin.js';
import { normalizePhone } from '../lib/phoneUtils.js';
import { sendTechnicianWelcomeEmail } from '../lib/emailService.js';
import { logAdminAction } from '../lib/adminLogger.js';

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

    // Don't send passwordHash to client
    const { passwordHash, ...technicianWithoutPassword } = technician;

    res.status(200).json(technicianWithoutPassword);
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new technician
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, picture, adminUserId } = req.body;

    // Ensure phone is an array
    let phoneArray = [];
    if (Array.isArray(phone)) {
      phoneArray = phone;
    } else if (phone) {
      phoneArray = [phone];
    }

    // Generate default password: "DTG" + last 4 digits of first phone
    // If no phone, use random 4 digits
    let defaultPassword;
    if (phoneArray.length > 0 && phoneArray[0].length >= 4) {
      defaultPassword = `DTG${phoneArray[0].slice(-4)}`;
    } else {
      defaultPassword = `DTG${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Check if Firebase user already exists and delete it
    try {
      await deleteFirebaseUser(email);
      console.log(`🗑️  Cleaned up existing Firebase user: ${email}`);
    } catch (cleanupError) {
      // User doesn't exist or cleanup failed - that's okay, continue
      console.log(`ℹ️  No existing Firebase user to clean up: ${email}`);
    }

    // Create technician in database
    const technician = await prisma.technician.create({
      data: {
        name,
        email,
        phone: phoneArray,
        picture: picture || '',
        passwordHash,
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

      // Try to send welcome email
    let emailSent = false;
    try {
      const emailResult = await sendTechnicianWelcomeEmail({
        to: email,
        name,
        password: defaultPassword,
        email,
      });
      emailSent = emailResult.success;
      if (emailSent) {
        console.log(`✅ Welcome email sent to: ${email}`);
      }
    } catch (emailError) {
      console.error(`⚠️  Failed to send email to ${email}:`, emailError.message);
      // Continue anyway - admin can share password manually
    }

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Created technician',
        `Created technician: ${name}`,
        { technicianId: technician.id, technicianName: name, email }
      );
    }

    // Return technician without passwordHash, but include default password in response for admin to share
    const { passwordHash: _, ...technicianData } = technician;

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
    const { name, email, phone, picture, adminUserId } = req.body;

    // Ensure phone is an array
    let phoneArray = [];
    if (Array.isArray(phone)) {
      phoneArray = phone;
    } else if (phone) {
      phoneArray = [phone];
    }

    const technician = await prisma.technician.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        email,
        phone: phoneArray,
        picture,
      },
    });

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Updated technician',
        `Updated technician: ${name}`,
        { technicianId: technician.id, technicianName: name, email }
      );
    }

    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a technician by ID
router.delete('/:id', async (req, res) => {
  try {
    const { adminUserId } = req.body;

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

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Deleted technician',
        `Deleted technician: ${technician.name}`,
        { technicianId: technician.id, technicianName: technician.name, email: technician.email }
      );
    }

    res.status(200).json({ message: 'Technician deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Partially update technician profile (for mobile app)
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'phone', 'picture', 'fcmToken'];
    
    // Only include allowed fields that are present in request
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Ensure phone is an array
        if (field === 'phone') {
          if (Array.isArray(req.body[field])) {
            updates[field] = req.body[field];
          } else if (req.body[field]) {
            updates[field] = [req.body[field]];
          } else {
            updates[field] = [];
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const technician = await prisma.technician.update({
      where: { id: parseInt(req.params.id) },
      data: updates,
    });

    // Don't send passwordHash to client
    const { passwordHash, ...technicianWithoutPassword } = technician;

    res.status(200).json(technicianWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Change technician password
router.post('/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log(`[Password Change] Request for technician ID: ${req.params.id}`);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Get technician with password
    const technician = await prisma.technician.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!technician) {
      console.log(`[Password Change] Technician not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Technician not found' });
    }

    console.log(`[Password Change] Found technician: ${technician.email}`);
    console.log(`[Password Change] Current password length: ${currentPassword.length}`);
    console.log(`[Password Change] New password length: ${newPassword.length}`);
    console.log(`[Password Change] Stored hash: ${technician.passwordHash.substring(0, 20)}...`);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, technician.passwordHash);
    
    console.log(`[Password Change] Password verification result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`[Password Change] FAILED - Current password is incorrect`);
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.technician.update({
      where: { id: parseInt(req.params.id) },
      data: { passwordHash },
    });

    console.log(`[Password Change] SUCCESS - Password updated for ${technician.email}`);

    // Update Firebase Auth password (optional - if Firebase sync is used)
    try {
      // TODO: Update Firebase password if needed
      // await updateFirebaseUserPassword(technician.email, newPassword);
    } catch (firebaseError) {
      console.error('Failed to update Firebase password:', firebaseError.message);
    }

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Password Change] ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Update FCM token for push notifications
router.post('/:id/fcm-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const technicianId = parseInt(req.params.id);

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    console.log(`[FCM Token] Updating token for technician ${technicianId}`);

    await prisma.technician.update({
      where: { id: technicianId },
      data: { fcmToken },
    });

    console.log(`[FCM Token] Successfully updated token for technician ${technicianId}`);

    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('[FCM Token] ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
