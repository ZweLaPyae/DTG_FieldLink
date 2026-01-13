const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new customer
router.post('/', async (req, res) => {
  try {
    const { id, name, phone, serviceTypeId, splitter, splitterMap } = req.body;
    
    // Build data object conditionally
    const data = {
      id,
      name,
      splitter,
      splitterMap,
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
    const { name, phone, serviceTypeId, splitter, splitterMap } = req.body;
    
    // Build data object conditionally
    const data = {
      name,
      splitter,
      splitterMap,
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

module.exports = router;