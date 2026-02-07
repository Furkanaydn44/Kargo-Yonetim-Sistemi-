const express = require('express');
const router = express.Router();
const { getStations, createStation } = require('../controllers/stationController');

router.get('/', getStations);
router.post('/', createStation);

module.exports = router;