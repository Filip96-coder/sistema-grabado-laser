const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const ordenesRoutes = require('./routes/ordenes.routes');
const informesRoutes = require('./routes/informes.routes');
const { requireAuth } = require('./middleware/auth.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/ordenes', requireAuth, ordenesRoutes);
app.use('/api/informes', requireAuth, informesRoutes);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
