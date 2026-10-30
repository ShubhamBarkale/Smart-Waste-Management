const Bin = require('../models/Bin');
const Task = require('../models/Task');
const Reading = require('../models/Reading');
const { v4: uuidv4 } = require('uuid');
const realtime = require('../services/realtime');
const { zoneForBin } = require('../config/zones');

const BIN_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

// ─────────────────────────────────────────────
// Shared ingestion logic (ESP32 + manual scanner)
//   → validates, saves, creates task, pushes live events
// ─────────────────────────────────────────────
const ingestReading = async (body, { source, allowCreate, user }) => {
  const { binId } = body;

  if (typeof binId !== 'string' || !BIN_ID_RE.test(binId.trim())) {
    return { code: 400, body: { success: false, message: 'binId is required (letters, numbers, - or _)' } };
  }
  const id = binId.trim();

  if (body.fillPercentage === undefined || body.fillPercentage === null || body.fillPercentage === '') {
    return { code: 400, body: { success: false, message: 'binId and fillPercentage are required' } };
  }
  const fill = Number(body.fillPercentage);
  if (!Number.isFinite(fill) || fill < 0 || fill > 100) {
    return { code: 400, body: { success: false, message: 'fillPercentage must be a number between 0 and 100' } };
  }
  const fillPercentage = Math.round(fill);

  // Employees may only touch bins in their own zone
  if (user && user.role === 'employee' && user.zone && zoneForBin(id) !== user.zone) {
    return { code: 403, body: { success: false, message: 'This bin is outside your zone' } };
  }

  let lat, lng;
  const hasLocation = body.lat !== undefined && body.lng !== undefined;
  if (hasLocation) {
    lat = Number(body.lat);
    lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return { code: 400, body: { success: false, message: 'lat/lng are invalid' } };
    }
  }

  let bin = await Bin.findOne({ binId: id });

  if (!bin) {
    if (!allowCreate) {
      return { code: 404, body: { success: false, message: 'Bin not found' } };
    }
    if (!hasLocation) {
      return { code: 400, body: { success: false, message: 'lat and lng are required when registering a new bin' } };
    }
    bin = new Bin({ binId: id, location: { lat, lng }, fillPercentage });
  } else {
    bin.fillPercentage = fillPercentage;
    if (hasLocation) bin.location = { lat, lng };
  }

  const previousStatus = bin.status;
  const previousLevel = bin.alertLevel ?? 0;
  await bin.save(); // pre-save hook derives status + alertLevel

  // History (never let this break the main flow)
  Reading.create({ binId: id, fillPercentage, source }).catch((e) =>
    console.error('Reading save failed:', e.message)
  );

  // Auto-create a collection task when the bin becomes Critical (≥ 90%)
  let newTask = null;
  if (bin.status === 'Critical' && previousStatus !== 'Critical') {
    const existing = await Task.findOne({ binId: id, status: { $in: ['Pending', 'In-Progress'] } });
    if (!existing) {
      newTask = await Task.create({
        taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
        binId: id,
        status: 'Pending',
      });
    }
  }

  // ── Live push to dashboards ─────────────────
  realtime.emitAll('bin:update', bin.toObject());
  if (newTask) realtime.emitAll('task:update', { taskId: newTask.taskId, binId: id });

  // Alert only when the bin crosses UP through 50 / 60 / 90
  if (bin.alertLevel > previousLevel) {
    realtime.emitAlert(
      {
        binId: id,
        level: bin.alertLevel,
        fillPercentage: bin.fillPercentage,
        status: bin.status,
        location: bin.location,
        taskCreated: Boolean(newTask),
        timestamp: new Date(),
      },
      zoneForBin(id)
    );
  }

  return { code: 200, body: { success: true, message: 'Bin updated successfully', data: bin } };
};

const makeUpdateHandler = (opts) => async (req, res) => {
  try {
    const result = await ingestReading(req.body || {}, { ...opts, user: req.user });
    return res.status(result.code).json(result.body);
  } catch (error) {
    console.error('updateBin error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/bins/update  — ESP32 (x-api-key). Creates the bin on first contact.
const updateBin = makeUpdateHandler({ source: 'device', allowCreate: true });

// POST /api/bins/manual-update — logged-in staff (Bin Scanner page). Existing bins only.
const manualUpdateBin = makeUpdateHandler({ source: 'manual', allowCreate: false });

// ─────────────────────────────────────────────
// GET /api/bins   (supports ?status= filter)
// ─────────────────────────────────────────────
const getAllBins = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      const allowed = ['Normal', 'Warning', 'Critical'];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }

    const bins = await Bin.find(filter).sort({ lastUpdated: -1 });
    return res.status(200).json({ success: true, count: bins.length, data: bins });
  } catch (error) {
    console.error('getAllBins error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/bins/critical  (admin)
// ─────────────────────────────────────────────
const getCriticalBins = async (req, res) => {
  try {
    const criticalBins = await Bin.find({ status: 'Critical' }).sort({ lastUpdated: -1 });

    const binIds = criticalBins.map((b) => b.binId);
    const openTasks = await Task.find({
      binId: { $in: binIds },
      status: { $in: ['Pending', 'In-Progress'] },
    }).populate('assignedEmployeeId', 'name email');

    const taskMap = openTasks.reduce((acc, task) => {
      if (!acc[task.binId]) acc[task.binId] = [];
      acc[task.binId].push(task);
      return acc;
    }, {});

    const result = criticalBins.map((bin) => ({
      ...bin.toObject(),
      openTasks: taskMap[bin.binId] || [],
    }));

    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('getCriticalBins error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/bins/:binId/history?hours=24   (recent readings for charts)
// ─────────────────────────────────────────────
const getBinHistory = async (req, res) => {
  try {
    const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 24 * 30);
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const data = await Reading.find({ binId: req.params.binId, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .limit(2000)
      .select('fillPercentage timestamp source -_id');
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getBinHistory error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/bins/:binId
// ─────────────────────────────────────────────
const getBinById = async (req, res) => {
  try {
    const bin = await Bin.findOne({ binId: req.params.binId });
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }
    return res.status(200).json({ success: true, data: bin });
  } catch (error) {
    console.error('getBinById error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { updateBin, manualUpdateBin, getAllBins, getCriticalBins, getBinById, getBinHistory };
