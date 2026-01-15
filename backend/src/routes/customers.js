import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { uploadKmz } from '../middleware/uploadKMZ.js';
import { kmzToGeoJson } from '../lib/kmzToGeojson.js';
import { uploadGeoJson } from '../lib/uploadGeojson.js';


// Create a new customer
router.post('/', async (req, res) => {
  try {
    const { id, name, phone, serviceTypeId, splitter } = req.body;
    
    // Build data object conditionally
    const data = {
      id,
      name,
      splitter,
    };
    
    // Only add phone if it's a non-empty array
    if (Array.isArray(phone) && phone.length > 0) {
      data.phone = phone;
    }
    
    // Use connect for serviceType relation
    if (serviceTypeId) {
      data.serviceType = {
        connect: { id: serviceTypeId }
      };
    }
    
    const newCustomer = await prisma.customer.create({
      data,
    });
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        serviceType: true,
        _count: {
          select: { tickets: true },
        },
      },
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        serviceType: true,
      },
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Update a customer by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, serviceTypeId, splitter } = req.body;
    
    // Build data object conditionally
    const data = {
      name,
      splitter,
    };
    
    // Only add phone if it's a non-empty array
    if (Array.isArray(phone) && phone.length > 0) {
      data.phone = phone;
    }
    
    // Use connect/disconnect for serviceType relation
    if (serviceTypeId) {
      data.serviceType = {
        connect: { id: serviceTypeId }
      };
    } else if (serviceTypeId === null) {
      data.serviceType = {
        disconnect: true
      };
    }
    
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data,
    });
    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

router.post(
  '/:id/splitter-map',
  uploadKmz.single('file'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'KMZ file is required' });
      }

      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // 1️⃣ KMZ → GeoJSON
      const geojson = await kmzToGeoJson(req.file.path);

      if (!geojson?.features?.length) {
        return res.status(400).json({ error: 'Invalid or empty GeoJSON' });
      }

      // 2️⃣ Upload to DigitalOcean Spaces
      const url = await uploadGeoJson({
        customerId: id,
        geojson,
      });

      // 3️⃣ Save URL
      await prisma.customer.update({
        where: { id },
        data: { splitterMap: url },
      });

      res.json({
        message: 'Splitter map uploaded',
        splitterMap: url,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);


export default router;