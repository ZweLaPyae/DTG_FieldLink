import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logAdminAction } from '../lib/adminLogger.js';
const router = express.Router();
const prisma = new PrismaClient();

// GET all root causes
router.get('/', async (req, res) => {
  try {
    const rootCauses = await prisma.rootCause.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(rootCauses);
  } catch (error) {
    console.error('Error fetching root causes:', error);
    res.status(500).json({ error: 'Failed to fetch root causes' });
  }
});

// Create root cause
router.post('/', async (req, res) => {
  try {
    const { name, adminUserId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const id = crypto.randomUUID();
    const trimmedName = name.trim();

    const created = await prisma.rootCause.create({
      data: {
        id,
        name: trimmedName,
      },
      select: { id: true, name: true },
    });

    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Created root cause',
        `Created root cause: ${trimmedName}`,
        { rootCauseId: id, name: trimmedName },
      );
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating root cause:', error);
    res.status(500).json({ error: 'Failed to create root cause' });
  }
});

// Update root cause
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, adminUserId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existing = await prisma.rootCause.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Root cause not found' });
    }

    const updated = await prisma.rootCause.update({
      where: { id },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });

    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Updated root cause',
        `Updated root cause: ${name}`,
        { rootCauseId: id, name },
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating root cause:', error);
    res.status(500).json({ error: 'Failed to update root cause' });
  }
});

// Delete root cause (with safety check)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUserId } = req.body;

    const existing = await prisma.rootCause.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Root cause not found' });
    }

    const inUseCount = await prisma.ticket.count({ where: { rootCauseId: id } });
    if (inUseCount > 0) {
      return res.status(400).json({ error: `Cannot delete: ${inUseCount} ticket(s) reference this root cause.` });
    }

    await prisma.rootCause.delete({ where: { id } });

    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Deleted root cause',
        `Deleted root cause: ${existing.name}`,
        { rootCauseId: id, name: existing.name },
      );
    }

    res.json({ message: 'Root cause deleted successfully' });
  } catch (error) {
    console.error('Error deleting root cause:', error);
    res.status(500).json({ error: 'Failed to delete root cause' });
  }
});

export default router;
