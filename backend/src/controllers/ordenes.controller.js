const OrdenTrabajo = require('../models/OrdenTrabajo');

const crearOrden = async (req, res) => {
  try {
    const orden = await OrdenTrabajo.create(req.body);
    res.status(201).json(orden);
  } catch (error) {
    // CastError de Mongoose → datos inválidos
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

const obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenTrabajo.find().sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenTrabajo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(orden);
  } catch (error) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

const eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenTrabajo.findByIdAndDelete(req.params.id);

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({ mensaje: 'Orden eliminada correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearOrden, obtenerOrdenes, actualizarOrden, eliminarOrden };
