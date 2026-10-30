const express = require('express');
const router  = express.Router();
const { getAllUsers, getUserById, getEmployeeAvailability } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/users                          — list users (admin only)
router.get('/', authorize('admin'), getAllUsers);

// GET /api/users/availability/:zone       — employees + availability for a zone (admin only)
router.get('/availability/:zone', authorize('admin'), getEmployeeAvailability);

// GET /api/users/:id                      — single user (admin only)
router.get('/:id', authorize('admin'), getUserById);

module.exports = router;
