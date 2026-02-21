// backend/src/routes/notifications.js
// Firebase Cloud Messaging routes for managing FCM tokens and sending notifications

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  sendNotification, 
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendAndStoreNotification,
  sendAndStoreMultipleNotifications
} from '../lib/notificationService.js';

const prisma = new PrismaClient();
const router = express.Router();

// ==================== FCM Token Management ====================

/**
 * Update technician FCM token
 * POST /notifications/technician/:id/token
 */
router.post('/technician/:id/token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const technicianId = parseInt(req.params.id);

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await prisma.technician.update({
      where: { id: technicianId },
      data: { fcmToken },
    });

    console.log(`✅ Updated FCM token for technician ${technicianId}`);
    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Error updating technician FCM token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update admin FCM token
 * POST /notifications/admin/:id/token
 */
router.post('/admin/:id/token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const adminId = parseInt(req.params.id);

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { fcmToken },
    });

    console.log(`✅ Updated FCM token for admin ${adminId}`);
    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Error updating admin FCM token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove technician FCM token (logout)
 * DELETE /notifications/technician/:id/token
 */
router.delete('/technician/:id/token', async (req, res) => {
  try {
    const technicianId = parseInt(req.params.id);

    await prisma.technician.update({
      where: { id: technicianId },
      data: { fcmToken: null },
    });

    console.log(`✅ Removed FCM token for technician ${technicianId}`);
    res.status(200).json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing technician FCM token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove admin FCM token (logout)
 * DELETE /notifications/admin/:id/token
 */
router.delete('/admin/:id/token', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { fcmToken: null },
    });

    console.log(`✅ Removed FCM token for admin ${adminId}`);
    res.status(200).json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing admin FCM token:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Send Notifications ====================

/**
 * Send notification to a specific technician
 * POST /notifications/send/technician/:id
 */
router.post('/send/technician/:id', async (req, res) => {
  try {
    const technicianId = parseInt(req.params.id);
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get technician's FCM token
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: { fcmToken: true, name: true },
    });

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    if (!technician.fcmToken) {
      return res.status(400).json({ error: 'Technician has no FCM token registered' });
    }

    const result = await sendNotification(technician.fcmToken, { title, body, data });
    
    if (result.success) {
      res.status(200).json({ message: 'Notification sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending notification to technician:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to a specific admin
 * POST /notifications/send/admin/:id
 */
router.post('/send/admin/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get admin's FCM token
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { fcmToken: true, name: true },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.fcmToken) {
      return res.status(400).json({ error: 'Admin has no FCM token registered' });
    }

    const result = await sendNotification(admin.fcmToken, { title, body, data });
    
    if (result.success) {
      res.status(200).json({ message: 'Notification sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending notification to admin:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to all technicians
 * POST /notifications/send/all-technicians
 */
router.post('/send/all-technicians', async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get all technician FCM tokens
    const technicians = await prisma.technician.findMany({
      where: { fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = technicians.map(t => t.fcmToken).filter(token => token);

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No technicians have FCM tokens registered' });
    }

    const result = await sendMulticastNotification(tokens, { title, body, data });
    
    res.status(200).json({
      message: 'Notifications sent',
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error('Error sending notification to all technicians:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to all admins
 * POST /notifications/send/all-admins
 */
router.post('/send/all-admins', async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get all admin FCM tokens
    const admins = await prisma.adminUser.findMany({
      where: { fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = admins.map(a => a.fcmToken).filter(token => token);

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No admins have FCM tokens registered' });
    }

    const result = await sendMulticastNotification(tokens, { title, body, data });
    
    res.status(200).json({
      message: 'Notifications sent',
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error('Error sending notification to all admins:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to team leader
 * POST /notifications/send/team/:teamId
 */
router.post('/send/team/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get team with leader
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        leader: {
          select: { fcmToken: true, name: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (!team.leader.fcmToken) {
      return res.status(400).json({ error: 'Team leader has no FCM token registered' });
    }

    const result = await sendNotification(team.leader.fcmToken, { title, body, data });
    
    if (result.success) {
      res.status(200).json({ message: 'Notification sent to team leader', messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending notification to team:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Test Endpoint ====================

/**
 * Test notification endpoint
 * POST /notifications/test
 */
router.post('/test', async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const result = await sendNotification(fcmToken, {
      title: 'Test Notification 🔔',
      body: 'This is a test notification from DTG FieldLink backend!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      res.status(200).json({ 
        message: 'Test notification sent successfully', 
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Fetch Notifications ====================

/**
 * Get notifications for a technician
 * GET /notifications/technician/:id?limit=20&unreadOnly=false
 */
router.get('/technician/:id', async (req, res) => {
  try {
    const technicianId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: technicianId,
        userType: 'technician',
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: technicianId,
        userType: 'technician',
        read: false,
      },
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching technician notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get notifications for an admin
 * GET /notifications/admin/:id?limit=20&unreadOnly=false
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: adminId,
        userType: 'admin',
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: adminId,
        userType: 'admin',
        read: false,
      },
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark notification(s) as read
 * PUT /notifications/mark-read
 * Body: { notificationIds: [1, 2, 3] } or { userId: 1, userType: 'technician', markAll: true }
 */
router.put('/mark-read', async (req, res) => {
  try {
    const { notificationIds, userId, userType, markAll } = req.body;

    if (markAll && userId && userType) {
      // Mark all notifications as read for a user
      const result = await prisma.notification.updateMany({
        where: {
          userId: parseInt(userId),
          userType: userType,
          read: false,
        },
        data: { read: true },
      });
      
      res.status(200).json({ 
        message: 'All notifications marked as read', 
        count: result.count 
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds.map(id => parseInt(id)) },
        },
        data: { read: true },
      });
      
      res.status(200).json({ 
        message: 'Notifications marked as read', 
        count: result.count 
      });
    } else {
      res.status(400).json({ error: 'Invalid request parameters' });
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete notification(s)
 * DELETE /notifications
 * Body: { notificationIds: [1, 2, 3] } or { userId: 1, userType: 'technician', deleteAll: true }
 */
router.delete('/', async (req, res) => {
  try {
    const { notificationIds, userId, userType, deleteAll } = req.body;

    if (deleteAll && userId && userType) {
      // Delete all notifications for a user
      const result = await prisma.notification.deleteMany({
        where: {
          userId: parseInt(userId),
          userType: userType,
        },
      });
      
      res.status(200).json({ 
        message: 'All notifications deleted', 
        count: result.count 
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds.map(id => parseInt(id)) },
        },
      });
      
      res.status(200).json({ 
        message: 'Notifications deleted', 
        count: result.count 
      });
    } else {
      res.status(400).json({ error: 'Invalid request parameters' });
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
