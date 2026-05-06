const express = require('express');
const router = express.Router();
const {
  crearOrden,
  obtenerOrdenes,
  actualizarOrden,
  eliminarOrden,
} = require('../controllers/ordenes.controller');

router.post('/', crearOrden);
router.get('/', obtenerOrdenes);
router.put('/:id', actualizarOrden);
router.delete('/:id', eliminarOrden);

module.exports = router;
