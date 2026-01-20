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
dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/tickets', ticketRoutes);
app.use('/service-type', serviceTypeRoutes);
app.use('/customers', customerRoutes);
app.use('/technicians', technicianRoutes);
app.use('/teams', teamRoutes);
app.use('/rootcauses', rootCauseRoutes);
app.use('/materials', materialRoutes);

// Auth routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
