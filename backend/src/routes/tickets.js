import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    const {
      ticketId,
      customerId,
      complaint,
      sla,
      issueTime,
      priority,

      // customer enrichment
      phone,
      serviceTypeId,
      splitter,

      // optional
      description,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch existing customer (only if needed)
      if (phone || serviceTypeId || splitter) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { phone: true },
        });

        const existingPhones = customer?.phone ?? [];

        // 2️⃣ Append phone only if it does NOT exist
        const updatedPhones =
          phone && !existingPhones.includes(phone)
            ? [...existingPhones, phone]
            : existingPhones;

        await tx.customer.update({
          where: { id: customerId },
          data: {
            ...(phone && { phone: updatedPhones }),
            ...(serviceTypeId && { serviceTypeId }),
            ...(splitter && { splitter }),
          },
        });
      }

      // 2️⃣ Create ticket
      const ticket = await tx.ticket.create({
        data: {
          id: ticketId,
          customerId,
          complaint,
          sla,
          issueTime: new Date(issueTime),
          status: 'NEW',
          priorityId: priority,
        },
      });

      return ticket;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});


// Read all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { issueTime: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            splitter: true,
          },
        },
        technician: {
          select: {
            name: true,
          },
        },
        priority: {
          select: {
            display: true,
          },
        },
      },
    })
    const formattedTickets = tickets.map(t => ({
      id: t.id,
      complaint: t.complaint,
      status: t.status,
      sla: t.sla,
      issueTime: t.issueTime,
      startTime: t.startTime,
      completionTime: t.completionTime,

      priorityId: t.priorityId,
      priority: t.priority?.display ?? t.priorityId,

      customerName: t.customer?.name ?? null,
      phone: t.customer?.phone ?? null,
      splitter: t.customer?.splitter ?? null,

      technicianId: t.technicianId,
      technician_display: t.technician?.name ?? null,
    }))
    res.status(200).json(formattedTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read a single ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        customer: {
          include: {
            serviceType: true,
          },
        },
        technician: true,
        priority: true,
        rootCause: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // If ticket has materials used, fetch material details from catalog
    if (ticket.materialsUsed && Array.isArray(ticket.materialsUsed)) {
      const materialIds = ticket.materialsUsed.map(m => m.materialId);
      const materials = await prisma.materialCatalog.findMany({
        where: {
          id: { in: materialIds }
        }
      });

      // Create a map for quick lookup
      const materialMap = {};
      materials.forEach(m => {
        materialMap[m.id] = m;
      });

      // Enrich materials data with catalog info and calculate total cost
      let calculatedTotalCost = 0;
      ticket.materialsUsed = ticket.materialsUsed.map(m => {
        const material = materialMap[m.materialId];
        const itemCost = material?.unitCost ? material.unitCost * (m.quantity || 0) : 0;
        calculatedTotalCost += itemCost;
        
        return {
          ...m,
          name: material?.name || `Unknown Material (ID: ${m.materialId})`,
          unitCost: material?.unitCost
        };
      });

      // Update the total cost in the database if it has changed
      if (calculatedTotalCost !== ticket.totalCost) {
        await prisma.ticket.update({
          where: { id: req.params.id },
          data: { totalCost: calculatedTotalCost }
        });
        ticket.totalCost = calculatedTotalCost;
      }
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a ticket by ID
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating ticket:', req.params.id);
    console.log('Update data:', req.body);
    
    // Convert startTime string to Date if present
    const updateData = { ...req.body };
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.completionTime) {
      updateData.completionTime = new Date(updateData.completionTime);
    }
    if (updateData.issueTime) {
      updateData.issueTime = new Date(updateData.issueTime);
    }
    
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    console.log('Ticket updated successfully:', ticket.id);
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
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

export default router;
