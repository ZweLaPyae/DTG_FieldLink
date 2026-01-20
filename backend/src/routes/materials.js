import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();

// GET all materials
router.get('/', async (req, res) => {
  try {
    const materials = await prisma.materialCatalog.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        unitCost: true,
        referenceLength: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

export default router;
