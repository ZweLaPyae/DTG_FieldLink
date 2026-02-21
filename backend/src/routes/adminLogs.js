import express from 'express';
import { PrismaClient } from '@prisma/client';
import { getAdminLogs, getAdminLogsCount, cleanupOldLogs } from '../lib/adminLogger.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get admin logs with filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, adminUserId, page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filters = {
      startDate,
      endDate,
      adminUserId: adminUserId ? parseInt(adminUserId) : undefined,
      limit: parseInt(limit),
      offset,
    };

    const [logs, totalCount] = await Promise.all([
      getAdminLogs(filters),
      getAdminLogsCount(filters),
    ]);

    res.status(200).json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual cleanup of old logs (can also be called by a cron job)
router.post('/cleanup', async (req, res) => {
  try {
    const deletedCount = await cleanupOldLogs();
    res.status(200).json({
      message: 'Cleanup completed successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Error during log cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
