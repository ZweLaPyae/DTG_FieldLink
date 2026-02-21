import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Log an admin action
 * @param {number} adminUserId - ID of the admin user performing the action
 * @param {string} action - Short description of the action (e.g., "Created ticket", "Updated customer")
 * @param {string} description - Optional detailed description
 * @param {object} metadata - Optional additional data (e.g., ticket IDs, customer info)
 */
export async function logAdminAction(adminUserId, action, description = null, metadata = null) {
  try {
    await prisma.adminLog.create({
      data: {
        adminUserId,
        action,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error - logging failures shouldn't break the main operation
  }
}

/**
 * Get admin logs with optional filters
 * @param {object} filters - Filter options (startDate, endDate, adminUserId, limit, offset)
 */
export async function getAdminLogs(filters = {}) {
  const { startDate, endDate, adminUserId, limit = 100, offset = 0 } = filters;

  const where = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      // Make endDate inclusive by setting it to end of day (23:59:59.999)
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt.lte = endOfDay;
    }
  }

  if (adminUserId) {
    where.adminUserId = adminUserId;
  }

  const logs = await prisma.adminLog.findMany({
    where,
    include: {
      adminUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return logs;
}

/**
 * Clean up logs older than 3 months
 * This should be run as a scheduled job (cron job)
 */
export async function cleanupOldLogs() {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await prisma.adminLog.deleteMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old admin logs`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    throw error;
  }
}

/**
 * Get total count of logs (for pagination)
 */
export async function getAdminLogsCount(filters = {}) {
  const { startDate, endDate, adminUserId } = filters;

  const where = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      // Make endDate inclusive by setting it to end of day (23:59:59.999)
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt.lte = endOfDay;
    }
  }

  if (adminUserId) {
    where.adminUserId = adminUserId;
  }

  return await prisma.adminLog.count({ where });
}
