const express = require('express');
const router = express.Router();
const {
  updateBin, manualUpdateBin, getAllBins, getCriticalBins, getBinById, getBinHistory,
} = require('../controllers/binController');
const { protect, authorize } = require('../middleware/auth');
const { deviceAuth } = require('../middleware/deviceAuth');

// POST /api/bins/update         — ESP32 sensor data (requires header x-api-key)
router.post('/update', deviceAuth, updateBin);

// POST /api/bins/manual-update  — staff correction from the Bin Scanner page (JWT)
router.post('/manual-update', protect, authorize('admin', 'employee'), manualUpdateBin);

// GET /api/bins/critical — admin: all critical bins with open tasks
router.get('/critical', protect, authorize('admin'), getCriticalBins);

// GET /api/bins — all bins (admin & employee)
router.get('/', protect, getAllBins);

// GET /api/bins/:binId/history — recent readings
router.get('/:binId/history', protect, getBinHistory);

// GET /api/bins/:binId — single bin
router.get('/:binId', protect, getBinById);

module.exports = router;
