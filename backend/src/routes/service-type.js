import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// Get all service types
router.get('/', async (req, res) => {
    try {
        const serviceTypes = await prisma.serviceType.findMany();
        res.status(200).json(serviceTypes);
    }
    catch (error) {
        console.error('Error fetching service types:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;