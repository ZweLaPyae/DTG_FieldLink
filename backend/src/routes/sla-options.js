import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// Get all SLA options
router.get('/', async (req, res) => {
    try {
        const slaOptions = await prisma.sLAOption.findMany();
        res.status(200).json(slaOptions);
    }
    catch (error) {
        console.error('Error fetching SLA options:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
