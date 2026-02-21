import cron from 'node-cron';
import { cleanupOldLogs } from '../lib/adminLogger.js';

/**
 * Cron job to clean up admin logs older than 3 months
 * Runs every day at 2:00 AM
 */
export function startLogCleanupJob() {
  // Schedule: "0 2 * * *" means every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled admin log cleanup...');
    try {
      const deletedCount = await cleanupOldLogs();
      console.log(`Cleanup completed. Deleted ${deletedCount} old logs.`);
    } catch (error) {
      console.error('Error during scheduled log cleanup:', error);
    }
  });

  console.log('Admin log cleanup cron job scheduled (runs daily at 2:00 AM)');
}
