import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import ticketRoutes from './routes/tickets.js';
import serviceTypeRoutes from './routes/service-type.js';
import customerRoutes from './routes/customers.js';
import authRoutes from './routes/auth.js';
import technicianRoutes from './routes/technicians.js';
import teamRoutes from './routes/teams.js';
import rootCauseRoutes from './routes/rootcauses.js';
import materialRoutes from './routes/materials.js';
import slaOptionsRoutes from './routes/sla-options.js';
import uploadRoutes from './routes/upload.js'; // File upload routes for DO Spaces
import priorityRoutes from './routes/priority.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({  
  origin: ["https://dtg-fieldlink.site", "http://localhost:3001", "http://localhost:3000"],
  credentials: true
}
));


// Routes
app.use('/tickets', ticketRoutes);
app.use('/service-type', serviceTypeRoutes);
app.use('/customers', customerRoutes);
app.use('/technicians', technicianRoutes);
app.use('/teams', teamRoutes);
app.use('/rootcauses', rootCauseRoutes);
app.use('/materials', materialRoutes);
app.use('/sla-options', slaOptionsRoutes);
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
});
