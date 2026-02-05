import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      include: {
        leadsTeam: true,
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

    res.status(200).json(technician);
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new technician
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, picture } = req.body;

    const technician = await prisma.technician.create({
      data: {
        name,
        email,
        phone: phone || '',
        picture: picture || '',
      },
    });

    res.status(201).json(technician);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a technician by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, picture } = req.body;

    const technician = await prisma.technician.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        email,
        phone,
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
    await prisma.technician.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: 'Technician deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
