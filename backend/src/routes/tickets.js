import express from 'express';
import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../lib/phoneUtils.js';
import { logAdminAction } from '../lib/adminLogger.js';
import { sendAndStoreMultipleNotifications } from '../lib/notificationService.js';
import upload from '../middleware/mediaUpload.js';

const prisma = new PrismaClient();

const router = express.Router();

// Create a new ticket
router.post('/', upload.array('attachments', 10), async (req, res) => {
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
      teamId, // Team assignment
      adminUserId, // For logging
    } = req.body;

    // Handle uploaded media files from admin
    const uploadedAttachments = req.files ? req.files.map(file => ({
      name: `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/ticket-media/${file.filename}`,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    })) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch existing customer (only if needed)
      if (phone || serviceTypeId || splitter) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { phone: true },
        });

        const existingPhones = customer?.phone ?? [];

        // Normalize the phone number
        const normalizedPhone = normalizePhone(phone);

        // 2️⃣ Append phone only if it does NOT exist (check normalized version)
        const updatedPhones =
          normalizedPhone && !existingPhones.includes(normalizedPhone)
            ? [...existingPhones, normalizedPhone]
            : existingPhones;

        await tx.customer.update({
          where: { id: customerId },
          data: {
            ...(normalizedPhone && { phone: updatedPhones }),
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
          status: teamId ? 'IN_PROGRESS' : 'NEW', // If team is assigned, set to IN_PROGRESS
          priorityId: priority,
          attachments: uploadedAttachments || [],
          ...(teamId && { teamId: parseInt(teamId) }),
        },
      });

      return ticket;
    });

    // Log the action
    if (adminUserId) {
      await logAdminAction(
        parseInt(adminUserId),
        'Created ticket',
        `Created ticket ${ticketId} for customer ${customerId}`,
        { ticketId, customerId, teamId }
      );
    }

    // Send notification to technicians
    try {
      let recipients = [];
      
      if (teamId) {
        // If team assigned, notify only team members
        const team = await prisma.team.findUnique({
          where: { id: parseInt(teamId) },
        });
        
        if (team) {
          const memberIds = team.memberIds ? (Array.isArray(team.memberIds) ? team.memberIds : [team.memberIds]) : [];
          const allMemberIds = [...new Set([team.leaderId, ...memberIds])];
          
          const members = await prisma.technician.findMany({
            where: { id: { in: allMemberIds } },
            select: { id: true, fcmToken: true }
          });
          
          recipients = members.map(m => ({
            userId: m.id,
            userType: 'technician',
            fcmToken: m.fcmToken
          }));
        }
      } else {
        // If no team assigned, notify ALL technicians
        const allTechs = await prisma.technician.findMany({
          select: { id: true, fcmToken: true },
        });
        
        recipients = allTechs.map(t => ({
          userId: t.id,
          userType: 'technician',
          fcmToken: t.fcmToken
        }));
      }

      if (recipients.length > 0) {
        await sendAndStoreMultipleNotifications(recipients, {
          title: 'New Ticket Assigned 🎫',
          body: `Ticket ${ticketId} has been ${teamId ? 'assigned to your team' : 'created and needs assignment'}`,
          data: {
            ticketId: ticketId,
            type: 'ticket_created',
            ...(teamId && { teamId: teamId.toString() }),
          },
        });
        console.log(`✅ Sent new ticket notification to ${recipients.length} technicians${teamId ? ' (team members)' : ' (all)'}`);
      }
    } catch (notifError) {
      console.error('Error sending new ticket notification:', notifError);
    }

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
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true,
            leader: {
              select: {
                name: true,
              },
            },
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

      teamId: t.teamId,
      team_display: t.team?.name ?? null,
      // Keep technicianId for backward compatibility (maps to team leader)
      technicianId: t.team?.leaderId ?? null,
      technician_display: t.team?.leader?.name ?? null,
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
        team: {
          include: {
            leader: true,
          },
        },
        priority: true,
        rootCause: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    console.log(`[GET Ticket] ${req.params.id} - Attachments in DB:`, ticket.attachments);
    console.log(`[GET Ticket] Attachments type:`, typeof ticket.attachments);
    console.log(`[GET Ticket] Is array?`, Array.isArray(ticket.attachments));

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

      // Enrich materials data with catalog info
      // Use pre-calculated cost from mobile (m.cost) if available, otherwise calculate
      let calculatedTotalCost = 0;
      ticket.materialsUsed = ticket.materialsUsed.map(m => {
        const material = materialMap[m.materialId];
        // Prioritize mobile's pre-calculated cost (handles METER units correctly)
        const itemCost = m.cost ?? (material?.unitCost ? material.unitCost * (m.quantity || 0) : 0);
        calculatedTotalCost += itemCost;
        
        return {
          ...m,
          name: material?.name || `Unknown Material (ID: ${m.materialId})`,
          unitCost: material?.unitCost,
          cost: itemCost
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
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a ticket by ID
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating ticket:', req.params.id);
    console.log('Update data:', req.body);
    
    // Convert date strings to Date objects if present
    const updateData = { ...req.body };
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.completionTime) {
      updateData.completionTime = new Date(updateData.completionTime);
    }
    if (updateData.technicianCompletionTime) {
      updateData.technicianCompletionTime = new Date(updateData.technicianCompletionTime);
    }
    if (updateData.issueTime) {
      updateData.issueTime = new Date(updateData.issueTime);
    }

    // If admin is adding a note or approving, append to technician note
    if ((updateData.adminNote || updateData.status === 'COMPLETED') && req.body.adminUserId) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: parseInt(req.body.adminUserId) },
        select: { name: true, email: true },
      });

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
        select: { technicianNote: true },
      });

      const adminName = admin?.name || admin?.email || 'Admin';
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      let appendedNote = existingTicket?.technicianNote || '';
      
      // Add admin note if provided
      if (updateData.adminNote) {
        appendedNote += `\n\n--- Note By: ${adminName} (${currentDate}) ---\n${updateData.adminNote}`;
        delete updateData.adminNote; // Remove adminNote from updateData as it's not a field in schema
      }
      
      // Add approval note if completing
      if (updateData.status === 'COMPLETED') {
        appendedNote += `\n\n--- Approved By: ${adminName} (${currentDate}) ---`;
      }
      
      updateData.technicianNote = appendedNote;
    }
    
    // Remove adminUserId from updateData as it's not a Ticket field
    delete updateData.adminUserId;
    
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Send notifications based on ticket changes
    try {
      // Notification: When ticket is assigned to a team
      if (updateData.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: updateData.teamId },
        });

        if (team) {
          // Get all team member IDs (including leader)
          const memberIds = team.memberIds ? (Array.isArray(team.memberIds) ? team.memberIds : [team.memberIds]) : [];
          const allMemberIds = [...new Set([team.leaderId, ...memberIds])];
          
          // Fetch team members with their FCM tokens
          const members = await prisma.technician.findMany({
            where: { id: { in: allMemberIds } },
            select: { id: true, fcmToken: true }
          });

          const recipients = members.map(m => ({
            userId: m.id,
            userType: 'technician',
            fcmToken: m.fcmToken
          }));
          
          if (recipients.length > 0) {
            await sendAndStoreMultipleNotifications(recipients, {
              title: 'New Ticket Assigned 🎫',
              body: `Ticket ${req.params.id} has been assigned to your team`,
              data: {
                ticketId: req.params.id,
                type: 'ticket_assigned',
                teamId: updateData.teamId.toString(),
              },
            });
            console.log(`✅ Sent ticket assignment notification to ${recipients.length} team members`);
          }
        }
      }

      // Notification: When ticket status changes to IN_PROGRESS
      if (updateData.status === 'IN_PROGRESS') {
        // Notify all team members that ticket has been moved to in-progress
        const ticketWithTeam = await prisma.ticket.findUnique({
          where: { id: req.params.id },
          include: { team: true },
        });

        if (ticketWithTeam?.team) {
          const memberIds = ticketWithTeam.team.memberIds ? 
            (Array.isArray(ticketWithTeam.team.memberIds) ? ticketWithTeam.team.memberIds : [ticketWithTeam.team.memberIds]) : [];
          const allMemberIds = [...new Set([ticketWithTeam.team.leaderId, ...memberIds])];
          
          const members = await prisma.technician.findMany({
            where: { id: { in: allMemberIds } },
            select: { id: true, fcmToken: true }
          });

          const recipients = members.map(m => ({
            userId: m.id,
            userType: 'technician',
            fcmToken: m.fcmToken
          }));
          
          if (recipients.length > 0) {
            await sendAndStoreMultipleNotifications(recipients, {
              title: 'Ticket Needs Attention 🔄',
              body: `Ticket ${req.params.id} has been moved back to in-progress`,
              data: {
                ticketId: req.params.id,
                type: 'ticket_in_progress',
              },
            });
            console.log(`✅ Sent in-progress notification to ${recipients.length} team members`);
          }
        }
      }

      // Notification: When ticket status changes to IN_REVIEW
      if (updateData.status === 'IN_REVIEW') {
        // Notify all admins that a ticket needs review
        const admins = await prisma.adminUser.findMany({
          select: { id: true, fcmToken: true },
        });

        const recipients = admins.map(a => ({
          userId: a.id,
          userType: 'admin',
          fcmToken: a.fcmToken
        }));
        
        if (recipients.length > 0) {
          await sendAndStoreMultipleNotifications(recipients, {
            title: 'Ticket Ready for Review 📋',
            body: `Ticket ${req.params.id} has been completed and needs your review`,
            data: {
              ticketId: req.params.id,
              type: 'ticket_review_requested',
            },
          });
          console.log(`✅ Sent review notification to ${recipients.length} admins`);
        }
      }

      // Notification: When admin completes the ticket
      if (updateData.status === 'COMPLETED') {
        // Notify all team members that ticket has been approved
        const ticketWithTeam = await prisma.ticket.findUnique({
          where: { id: req.params.id },
          include: { team: true },
        });

        if (ticketWithTeam?.team) {
          const memberIds = ticketWithTeam.team.memberIds ? 
            (Array.isArray(ticketWithTeam.team.memberIds) ? ticketWithTeam.team.memberIds : [ticketWithTeam.team.memberIds]) : [];
          const allMemberIds = [...new Set([ticketWithTeam.team.leaderId, ...memberIds])];
          
          const members = await prisma.technician.findMany({
            where: { id: { in: allMemberIds } },
            select: { id: true, fcmToken: true }
          });

          const recipients = members.map(m => ({
            userId: m.id,
            userType: 'technician',
            fcmToken: m.fcmToken
          }));
          
          if (recipients.length > 0) {
            await sendAndStoreMultipleNotifications(recipients, {
              title: 'Ticket Completed ✅',
              body: `Ticket ${req.params.id} has been reviewed and completed`,
              data: {
                ticketId: req.params.id,
                type: 'ticket_completed',
              },
            });
            console.log(`✅ Sent ticket completion notification to ${recipients.length} team members`);
          }
        }
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('Error sending notification:', notificationError);
    }

    // Log the action if adminUserId is provided
    if (req.body.adminUserId) {
      await logAdminAction(
        parseInt(req.body.adminUserId),
        'Updated ticket',
        `Updated ticket ${req.params.id}`,
        { ticketId: req.params.id, changes: Object.keys(updateData) }
      );
    }
    
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

    // Log the action if adminUserId is provided
    if (req.body.adminUserId) {
      await logAdminAction(
        parseInt(req.body.adminUserId),
        'Deleted ticket',
        `Deleted ticket ${req.params.id}`,
        { ticketId: req.params.id }
      );
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
