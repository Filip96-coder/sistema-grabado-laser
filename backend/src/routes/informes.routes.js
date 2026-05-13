const express = require('express');
const router = express.Router();
const {
  generarInformeOperacion,
  generarInformeOrdenes,
} = require('../controllers/informes.controller');

router.get('/operacion', generarInformeOperacion);
router.get('/ordenes', generarInformeOrdenes);

module.exports = router;
