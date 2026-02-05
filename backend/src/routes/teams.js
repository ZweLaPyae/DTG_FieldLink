import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        leader: true,
        tickets: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new team
router.post('/', async (req, res) => {
  try {
    const { name, leaderId, memberIds, specialization, location, status } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        leaderId: parseInt(leaderId),
        memberIds: memberIds || [],
        specialization: specialization || '',
        activeTickets: 0,
        completedTickets: 0,
        location: location || '',
        status: status || 'active',
      },
      include: {
        leader: true,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a team by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, leaderId, memberIds, specialization, location, status, activeTickets, completedTickets } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (leaderId !== undefined) data.leaderId = parseInt(leaderId);
    if (memberIds !== undefined) data.memberIds = memberIds;
    if (specialization !== undefined) data.specialization = specialization;
    if (location !== undefined) data.location = location;
    if (status !== undefined) data.status = status;
    if (activeTickets !== undefined) data.activeTickets = activeTickets;
    if (completedTickets !== undefined) data.completedTickets = completedTickets;

    const team = await prisma.team.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: {
        leader: true,
      },
    });

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a team by ID
router.delete('/:id', async (req, res) => {
  try {
    await prisma.team.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
