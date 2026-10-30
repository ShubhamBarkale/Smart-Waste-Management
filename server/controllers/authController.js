const User = require('../models/User');
const jwt = require('jsonwebtoken');

const cleanEmail = (v) => String(v || '').trim().toLowerCase();

// Helper – sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Is the (optional) Bearer token on this request an admin's?
const requesterIsAdmin = async (req) => {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return false;
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const u = await User.findById(decoded.id);
    return Boolean(u && u.isActive && u.role === 'admin');
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const email = cleanEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // SECURITY: the role is never taken blindly from the request.
    //  • very first account in an empty database  → admin (bootstrap)
    //  • request made by a logged-in admin        → may choose 'admin' or 'employee'
    //  • everyone else                            → employee
    let assignedRole = 'employee';
    if ((await User.estimatedDocumentCount()) === 0) {
      assignedRole = 'admin';
    } else if (role === 'admin' && (await requesterIsAdmin(req))) {
      assignedRole = 'admin';
    }

    const user = await User.create({ name, email, password: String(password), role: assignedRole });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, zone: user.zone },
    });
  } catch (error) {
    console.error('register error:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, zone: user.zone },
    });
  } catch (error) {
    console.error('login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getMe error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe };
