import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import ticketRoutes from './routes/tickets.js';
import serviceTypeRoutes from './routes/service-type.js';
import customerRoutes from './routes/customers.js';
import authRoutes from './routes/auth.js';
import technicianRoutes from './routes/technicians.js';
import teamRoutes from './routes/teams.js';
import rootCauseRoutes from './routes/rootcauses.js';
import materialRoutes from './routes/materials.js';
import uploadRoutes from './routes/upload.js'; // File upload routes for DO Spaces
import adminLogsRoutes from './routes/adminLogs.js';
import adminProfileRoutes from './routes/adminProfile.js';
import notificationRoutes from './routes/notifications.js';
import { startLogCleanupJob } from './scripts/logCleanupCron.js';
import priorityRoutes from './routes/priority.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://dtg-fieldlink.site",
      "http://localhost:3001",
      "http://localhost:3000",
      "https://www.dtg-fieldlink.site"
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now (mobile apps need this)
    }
  },
  credentials: true
}));

// Serve static files for uploaded media
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Routes
app.use('/tickets', ticketRoutes);
app.use('/service-type', serviceTypeRoutes);
app.use('/customers', customerRoutes);
app.use('/technicians', technicianRoutes);
app.use('/teams', teamRoutes);
app.use('/rootcauses', rootCauseRoutes);
app.use('/materials', materialRoutes);
app.use('/admin-logs', adminLogsRoutes);
app.use('/admin-profile', adminProfileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Upload routes for DigitalOcean Spaces
// ⚠️ TODO: Configure DO Spaces in .env before using
// Add DO_SPACES environment variables to backend/.env for file upload functionality
app.use('/api/upload', uploadRoutes);

// Use the priority routes
app.use('/priority', priorityRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the log cleanup cron job
  startLogCleanupJob();
});
