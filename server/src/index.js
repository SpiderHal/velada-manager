const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Login
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

// Gestión de Usuarios (Solo ADMIN puede crear)
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

// Listar todos los usuarios (Para el panel de Admin)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las mesas y asientos
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        seats: { orderBy: { seatNumber: 'asc' } }
      },
      orderBy: { number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reservar asientos
app.post('/api/reserve', async (req, res) => {
  const { seatIds, buyerName } = req.body;
  if (!seatIds?.length || !buyerName) {
    return res.status(400).json({ error: 'Datos incompletos' });
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

      return { success: true };
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancelar reserva (Acceso para ADMIN y USER según tu petición)
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

// Verificar QR
app.post('/api/verify-qr', async (req, res) => {
  const { buyer, seats } = req.body;
  
  if (!buyer || !seats || !Array.isArray(seats)) {
    return res.status(400).json({ error: 'Datos de QR inválidos' });
  }

  try {
    // Buscamos los asientos por número de mesa y asiento para mayor seguridad
    const verificationResults = [];
    let allValid = true;

    for (const s of seats) {
      const dbSeat = await prisma.seat.findFirst({
        where: {
          seatNumber: s.a,
          table: { number: s.m }
        },
        include: { table: true }
      });

      if (!dbSeat || dbSeat.status !== 'OCCUPIED' || dbSeat.buyerName !== buyer) {
        allValid = false;
        verificationResults.push({
          mesa: s.m,
          asiento: s.a,
          status: 'INVALID',
          reason: !dbSeat ? 'No existe' : (dbSeat.status !== 'OCCUPIED' ? 'No está ocupado' : 'Comprador no coincide')
        });
      } else {
        verificationResults.push({
          mesa: s.m,
          asiento: s.a,
          status: 'VALID'
        });
      }
    }

    res.json({
      valid: allValid,
      buyer,
      details: verificationResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RESPALDOS (Exportar/Importar) ---

// Exportar todos los datos a JSON
app.get('/api/backup/export', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({ include: { seats: true } });
    const users = await prisma.user.findMany();
    res.json({
      timestamp: new Date().toISOString(),
      tables,
      users
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

// Importar datos desde JSON
app.post('/api/backup/import', async (req, res) => {
  const { tables, users } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      // Limpiar datos actuales (opcional, pero recomendado para una importación limpia)
      await tx.seat.deleteMany();
      await tx.table.deleteMany();
      await tx.user.deleteMany();

      // Importar Tablas y Asientos
      for (const table of tables) {
        const { seats, ...tableData } = table;
        const createdTable = await tx.table.create({ data: tableData });
        if (seats && seats.length > 0) {
          await tx.seat.createMany({
            data: seats.map(s => ({ ...s, tableId: createdTable.id }))
          });
        }
      }

      // Importar Usuarios
      await tx.user.createMany({ data: users });
    });
    res.json({ success: true, message: 'Datos importados correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al importar datos: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
