const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Login simple
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario (Admin)
app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: { username, password, role: role || 'USER' }
    });
    res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: 'El usuario ya existe o datos inválidos' });
  }
});

// Get all tables and seats
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        seats: {
          orderBy: { seatNumber: 'asc' }
        },
      },
      orderBy: { number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reserve seats
app.post('/api/reserve', async (req, res) => {
  const { seatIds, buyerName } = req.body;

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos un asiento.' });
  }

  if (!buyerName) {
    return res.status(400).json({ error: 'El nombre del comprador es obligatorio.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const seats = await tx.seat.findMany({
        where: { id: { in: seatIds }, status: 'AVAILABLE' },
      });

      if (seats.length !== seatIds.length) {
        throw new Error('Uno o más asientos ya no están disponibles.');
      }

      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'OCCUPIED', buyerName },
      });

      return { success: true, reservationDate: new Date() };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel reservation (Admin)
app.post('/api/cancel', async (req, res) => {
  const { seatIds } = req.body;
  try {
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'AVAILABLE', buyerName: null },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
