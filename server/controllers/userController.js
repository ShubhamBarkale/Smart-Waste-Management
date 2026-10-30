const User  = require('../models/User');
const Task  = require('../models/Task');

// GET /api/users  — admin: list users, optional ?role= and ?zone= filters
const getAllUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role) {
      const allowed = ['admin', 'employee'];
      if (!allowed.includes(req.query.role)) {
        return res.status(400).json({ success: false, message: 'Invalid role filter' });
      }
      filter.role = req.query.role;
    }

    if (req.query.zone) {
      const allowed = ['kopargaon', 'shirdi'];
      if (!allowed.includes(req.query.zone)) {
        return res.status(400).json({ success: false, message: 'Invalid zone filter' });
      }
      filter.zone = req.query.zone;
    }

    const users = await User.find(filter).select('-password').sort({ zone: 1, name: 1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getUserById error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/availability/:zone — employees with availability status
// Returns each employee with isBusy: true if they have an active (non-completed) task
const getEmployeeAvailability = async (req, res) => {
  try {
    const { zone } = req.params;
    const allowed = ['kopargaon', 'shirdi'];
    if (!allowed.includes(zone)) {
      return res.status(400).json({ success: false, message: 'Invalid zone' });
    }

    const employees = await User.find({ role: 'employee', zone }).select('-password').sort({ name: 1 });

    // Find all active tasks (Pending or In-Progress) and get their assigned employee IDs
    const activeTasks = await Task.find({ status: { $in: ['Pending', 'In-Progress'] }, assignedEmployeeId: { $ne: null } })
      .select('assignedEmployeeId taskId binId status');

    const busyEmployeeIds = new Set(activeTasks.map(t => String(t.assignedEmployeeId)));

    const result = employees.map(emp => ({
      ...emp.toObject(),
      isBusy:      busyEmployeeIds.has(String(emp._id)),
      activeTasks: activeTasks.filter(t => String(t.assignedEmployeeId) === String(emp._id)),
    }));

    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('getEmployeeAvailability error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllUsers, getUserById, getEmployeeAvailability };
