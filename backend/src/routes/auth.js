import express from 'express';
import bcrypt from 'bcryptjs';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// POST /auth/login - verify credentials and return basic user profile
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Unable to log in.' });
  }
});

// POST /auth/change-password - update password after verifying current one
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  try {
    const id = Number(userId);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid user identifier.' });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: hashed },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Unable to change password.' });
  }
});

export default router;
