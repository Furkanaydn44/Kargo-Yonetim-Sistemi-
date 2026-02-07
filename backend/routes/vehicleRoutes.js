const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, vehicleController.getVehicles);
router.post('/', authMiddleware, vehicleController.addVehicle);
router.get('/routes', authMiddleware, vehicleController.getVehicleRoutes); // New Endpoint
router.put('/:id/status', authMiddleware, vehicleController.updateVehicleStatus);
router.post('/optimize', authMiddleware, vehicleController.optimizeFleet); // Adding auth for consistency

module.exports = router;
