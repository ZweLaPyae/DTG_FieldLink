const express = require('express');
const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth');
const cors = require('cors');
require('dotenv').config()
const app = express();

app.use(express.json());
app.use(cors());

// Ticket routes
app.use('/tickets', ticketRoutes);

// Auth routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});