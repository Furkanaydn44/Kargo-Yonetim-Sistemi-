const express = require('express');
const router = express.Router();
const { createCargo, getAllCargos, bulkCreateCargos, deleteAllCargos } = require('../controllers/cargoController');
const authMiddleware = require('../middleware/authMiddleware'); // Sadece giriş yapanlar girebilsin

// Middleware ekledik: Önce kimlik kontrolü yapar, sonra controller'a gider
router.post('/', authMiddleware, createCargo);
router.get('/', authMiddleware, getAllCargos);
router.post('/bulk', authMiddleware, bulkCreateCargos);
router.delete('/', authMiddleware, deleteAllCargos);

module.exports = router;