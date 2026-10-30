const crypto = require('crypto');

/**
 * Protects the IoT ingestion endpoint.
 * The ESP32 must send the header:   x-api-key: <DEVICE_API_KEY>
 */
const deviceAuth = (req, res, next) => {
  const expected = process.env.DEVICE_API_KEY;
  if (!expected) {
    console.error('DEVICE_API_KEY is not set in server/.env – refusing device requests');
    return res.status(500).json({ success: false, message: 'Device key not configured on server' });
  }

  const provided = String(req.headers['x-api-key'] || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid or missing device API key' });
  }
  next();
};

module.exports = { deviceAuth };
