const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const router = express.Router();

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    const ticket = await prisma.ticket.create({
      data: {
        id: req.body.ticketId,          
        customerId: req.body.customerId,
        complaint: req.body.complaint,
        sla: req.body.sla,
        issueTime: new Date(req.body.issueTime),

        status: req.body.isDraft ? 'DRAFT' : 'OPEN',

        priorityId: req.body.priority,

        // optional fields
        rootCauseDetails: req.body.description,
      },
    })

    res.status(201).json(ticket)
  } catch (error) {
    console.error('Error creating ticket:', error)
    res.status(500).json({ error: error.message })
  }
})


// Read all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read a single ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a ticket by ID
router.put('/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a ticket by ID
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ticket.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
