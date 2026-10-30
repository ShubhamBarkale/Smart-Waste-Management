require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const realtime = require('./services/realtime');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in server/.env – copy .env.example to .env first.');
  process.exit(1);
}
if (!process.env.DEVICE_API_KEY) {
  console.warn('⚠️  DEVICE_API_KEY is not set – ESP32 requests to /api/bins/update will be rejected.');
}

// ── Connect to MongoDB ────────────────────────
connectDB();

const app = express();
const server = http.createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ── Live updates (Socket.IO) ──────────────────
realtime.init(server, CLIENT_ORIGIN);

// ── Global Middleware ─────────────────────────
// Browsers need CORS; the ESP32 is not a browser, so it is unaffected.
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bins', require('./routes/bins'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// ── Health check ──────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── 404 handler ───────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ──────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.status && err.status < 500 ? err.message : 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
// '0.0.0.0' so the ESP32 on your Wi-Fi can reach the PC running the server
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server };
