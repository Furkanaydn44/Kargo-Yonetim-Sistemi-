const express = require('express');
const router = express.Router();
const { optimizeRoutes } = require('../controllers/optimizationController');

// POST isteği ile tetiklenecek: localhost:5000/api/optimize
router.post('/optimize', optimizeRoutes);
router.post('/analyze', require('../controllers/optimizationController').analyzeAllScenarios);

module.exports = router;