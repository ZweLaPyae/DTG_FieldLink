import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import e from 'express';
const prisma = new PrismaClient();
// Endpoint to fetch priority levels
router.get('/', async (req, res) => {
  try {
    console.log('Executing query to fetch priorities...');
    const priorities = await prisma.priority.findMany();
    console.log('Query result:', priorities);
    res.json(priorities);
  } catch (error) {
    console.error('Error fetching priorities:', error);
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
});

export default router;