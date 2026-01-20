import express from 'express';
import { PrismaClient } from '@prisma/client';
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

export default router;
