const express = require('express');
const router = express.Router();
const { generarInformeOperacion } = require('../controllers/informes.controller');

router.get('/operacion', generarInformeOperacion);

module.exports = router;
