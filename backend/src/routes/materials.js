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

// GET single material by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const material = await prisma.materialCatalog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// POST create new material
router.post('/', async (req, res) => {
  try {
    const { name, unit, unitCost, referenceLength } = req.body;

    if (!name || !unit || unitCost === undefined) {
      return res.status(400).json({ error: 'Name, unit, and unitCost are required' });
    }

    // Validate unit type
    if (unit !== 'PIECE' && unit !== 'METER') {
      return res.status(400).json({ error: 'Unit must be either PIECE or METER' });
    }

    // Validate referenceLength for METER type
    if (unit === 'METER' && !referenceLength) {
      return res.status(400).json({ error: 'Reference length is required for METER unit type' });
    }

    const material = await prisma.materialCatalog.create({
      data: {
        name: name.trim(),
        unit,
        unitCost: parseFloat(unitCost),
        referenceLength: unit === 'METER' && referenceLength ? parseFloat(referenceLength) : null,
      },
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// PUT update material
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, unitCost, referenceLength } = req.body;

    // Check if material exists
    const existing = await prisma.materialCatalog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (!name || !unit || unitCost === undefined) {
      return res.status(400).json({ error: 'Name, unit, and unitCost are required' });
    }

    // Validate unit type
    if (unit !== 'PIECE' && unit !== 'METER') {
      return res.status(400).json({ error: 'Unit must be either PIECE or METER' });
    }

    // Validate referenceLength for METER type
    if (unit === 'METER' && !referenceLength) {
      return res.status(400).json({ error: 'Reference length is required for METER unit type' });
    }

    const material = await prisma.materialCatalog.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        unit,
        unitCost: parseFloat(unitCost),
        referenceLength: unit === 'METER' && referenceLength ? parseFloat(referenceLength) : null,
      },
    });

    res.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// DELETE material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if material exists
    const existing = await prisma.materialCatalog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await prisma.materialCatalog.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;
