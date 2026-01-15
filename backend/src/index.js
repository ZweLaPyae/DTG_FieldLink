const express = require('express');
const ticketRoutes = require('./routes/tickets');
const serviceTypeRoutes = require('./routes/service-type');
const customerRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');
const technicianRoutes = require('./routes/technicians');
const teamRoutes = require('./routes/teams');
const cors = require('cors');
require('dotenv').config()
const app = express();

app.use(express.json());
app.use(cors());

// Ticket routes
app.use('/tickets', ticketRoutes);
app.use('/service-type', serviceTypeRoutes);
app.use('/customers', customerRoutes);
app.use('/technicians', technicianRoutes);
app.use('/teams', teamRoutes);

// Auth routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});