import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '../lib/adminLogger.js';

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
        Ticket: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Calculate ticket counts from actual tickets
    const teamsWithCounts = teams.map(team => {
      const activeTickets = team.Ticket.filter(
        ticket => ticket.status === 'IN_PROGRESS' || ticket.status === 'IN_REVIEW'
      ).length;
      const completedTickets = team.Ticket.filter(
        ticket => ticket.status === 'COMPLETED'
      ).length;

      return {
        ...team,
        activeTickets,
        completedTickets,
      };
    });

    res.status(200).json(teamsWithCounts);
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
    console.error('Error fetching team by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new team
router.post('/', async (req, res) => {
  try {
    const { name, leaderId, memberIds, specialization, location, status, adminUserId } = req.body;

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

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Created team',
        `Created team: ${name}`,
        { teamId: team.id, teamName: name }
      );
    }

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a team by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, leaderId, memberIds, specialization, location, status, activeTickets, completedTickets, adminUserId } = req.body;

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

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Updated team',
        `Updated team: ${team.name}`,
        { teamId: team.id, teamName: team.name }
      );
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a team by ID
router.delete('/:id', async (req, res) => {
  try {
    const { adminUserId } = req.body;

    // Get team info before deleting
    const team = await prisma.team.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true }
    });

    await prisma.team.delete({
      where: { id: parseInt(req.params.id) },
    });

    // Log the action
    if (adminUserId && team) {
      await logAdminAction(
        parseInt(adminUserId),
        'Deleted team',
        `Deleted team: ${team.name}`,
        { teamId: team.id, teamName: team.name }
      );
    }

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
