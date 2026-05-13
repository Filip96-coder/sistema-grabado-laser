const express = require('express');

const { obtenerResumenAdmin } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/resumen', obtenerResumenAdmin);

module.exports = router;
