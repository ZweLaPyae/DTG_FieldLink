const express = require('express');
const ticketRoutes = require('./routes/tickets');
const cors = require('cors');
require('dotenv').config()
const app = express();

app.use(express.json());
app.use(cors());

// Ticket routes
app.use('/tickets', ticketRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});