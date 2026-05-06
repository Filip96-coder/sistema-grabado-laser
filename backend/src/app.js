const express = require('express');
const cors = require('cors');

const ordenesRoutes = require('./routes/ordenes.routes');
const informesRoutes = require('./routes/informes.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ordenes', ordenesRoutes);
app.use('/api/informes', informesRoutes);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
