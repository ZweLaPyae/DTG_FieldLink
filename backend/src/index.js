const express = require('express');
const ticketRoutes = require('./routes/tickets');
const serviceTypeRoutes = require('./routes/service-type');
const customerRoutes = require('./routes/customers');
const cors = require('cors');
require('dotenv').config()
const app = express();

app.use(express.json());
app.use(cors());

// Ticket routes
app.use('/tickets', ticketRoutes);
app.use('/service-type', serviceTypeRoutes);
app.use('/customers', customerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});