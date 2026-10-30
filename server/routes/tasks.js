const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  assignTask,
  updateTaskStatus,
  getTaskById,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

// All task routes require authentication
router.use(protect);

// GET  /api/tasks        — list all tasks
router.get('/', getAllTasks);

// POST /api/tasks        — create task manually (admin only)
router.post('/', authorize('admin'), createTask);

// GET  /api/tasks/:taskId
router.get('/:taskId', getTaskById);

// PATCH /api/tasks/:taskId/assign  — assign employee (admin only)
router.patch('/:taskId/assign', authorize('admin'), assignTask);

// PATCH /api/tasks/:taskId/status  — update status (admin or assigned employee)
router.patch('/:taskId/status', updateTaskStatus);

module.exports = router;
