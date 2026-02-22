import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logAdminAction } from '../lib/adminLogger.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get admin profile by ID
router.get('/:id', async (req, res) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update admin profile
router.put('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { name, email, phone, picture, currentPassword, newPassword } = req.body;

    // If changing password, verify current password first
    if (newPassword && currentPassword) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const updatedAdmin = await prisma.adminUser.update({
        where: { id: adminId },
        data: {
          name,
          email,
          phone,
          picture,
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          picture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await logAdminAction(
        adminId,
        'Updated profile',
        'Admin updated their profile including password',
        { adminId }
      );

      return res.status(200).json(updatedAdmin);
    }

    // Update profile without password change
    const updatedAdmin = await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        name,
        email,
        phone,
        picture,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAdminAction(
      adminId,
      'Updated profile',
      'Admin updated their profile information',
      { adminId }
    );

    res.status(200).json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all admins (for admin management page)
router.get('/', async (req, res) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Update FCM token for push notifications
router.post('/:id/fcm-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const adminId = parseInt(req.params.id);

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    console.log(`[FCM Token] Updating token for admin ${adminId}`);

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { fcmToken },
    });

    console.log(`[FCM Token] Successfully updated token for admin ${adminId}`);

    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('[FCM Token] ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
