const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

/** Attach Socket.IO to the HTTP server. Clients must connect with their JWT. */
function init(httpServer, corsOrigin) {
  io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('unauthorized'));
      socket.data.user = { id: String(user._id), role: user.role, zone: user.zone };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { role, zone } = socket.data.user;
    socket.join(role === 'admin' ? 'admins' : 'employees');
    if (zone) socket.join(`zone:${zone}`);
  });

  return io;
}

/** Everyone logged in (used to tell dashboards "data changed, refresh"). */
function emitAll(event, payload) {
  if (io) io.emit(event, payload);
}

/** Threshold alert → all admins + employees of that bin's zone (no duplicates). */
function emitAlert(payload, zone) {
  if (!io) return;
  let target = io.to('admins');
  if (zone) target = target.to(`zone:${zone}`);
  target.emit('bin:alert', payload);
}

module.exports = { init, emitAll, emitAlert };
