const Task = require('../models/Task');
const User = require('../models/User');
const Bin = require('../models/Bin');
const { v4: uuidv4 } = require('uuid');
const realtime = require('../services/realtime');

// ─────────────────────────────────────────────
// GET /api/tasks
// List all tasks (optional ?status= filter)
// ─────────────────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      const allowed = ['Pending', 'In-Progress', 'Completed'];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate('assignedEmployeeId', 'name email role')
      .sort({ timestamp: -1 });

    return res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('getAllTasks error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/tasks
// Create a task manually (admin)
// ─────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { binId, assignedEmployeeId } = req.body;

    if (!binId) {
      return res.status(400).json({ success: false, message: 'binId is required' });
    }

    const bin = await Bin.findOne({ binId });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    if (assignedEmployeeId) {
      const employee = await User.findById(assignedEmployeeId);
      if (!employee || employee.role !== 'employee') {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
    }

    const task = await Task.create({
      taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
      binId,
      assignedEmployeeId: assignedEmployeeId || null,
      status: 'Pending',
      timestamp: new Date(),
    });

    realtime.emitAll('task:update', { taskId: task.taskId, binId });
    return res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (error) {
    console.error('createTask error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/tasks/:taskId/assign
// Assign an employee to a task (admin)
// ─────────────────────────────────────────────
const assignTask = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const task = await Task.findOne({ taskId: req.params.taskId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot reassign a completed task' });
    }

    task.assignedEmployeeId = employeeId;
    task.status = 'In-Progress';
    await task.save();

    realtime.emitAll('task:update', { taskId: task.taskId, binId: task.binId });
    return res.status(200).json({ success: true, message: 'Task assigned', data: task });
  } catch (error) {
    console.error('assignTask error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/tasks/:taskId/status
// Update task status (employee or admin)
// ─────────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'In-Progress', 'Completed'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const task = await Task.findOne({ taskId: req.params.taskId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Employees may only update tasks assigned to them
    if (req.user.role === 'employee' && String(task.assignedEmployeeId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This task is not assigned to you' });
    }

    task.status = status;
    await task.save();

    // When task is completed, the bin has been emptied → reset it (and its alert level)
    if (status === 'Completed') {
      const bin = await Bin.findOneAndUpdate(
        { binId: task.binId },
        { fillPercentage: 0, status: 'Normal', alertLevel: 0, lastUpdated: new Date() },
        { new: true }
      );
      if (bin) realtime.emitAll('bin:update', bin.toObject());
    }
    realtime.emitAll('task:update', { taskId: task.taskId, binId: task.binId });

    return res.status(200).json({ success: true, message: 'Task status updated', data: task });
  } catch (error) {
    console.error('updateTaskStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/tasks/:taskId
// Fetch a single task
// ─────────────────────────────────────────────
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.taskId }).populate(
      'assignedEmployeeId',
      'name email role'
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error('getTaskById error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllTasks, createTask, assignTask, updateTaskStatus, getTaskById };
