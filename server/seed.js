/**
 * Seed script — Kopargaon & Shirdi locations only.
 * Run:  node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Bin  = require('./models/Bin');
const Task = require('./models/Task');
const User = require('./models/User');
const Reading = require('./models/Reading');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad  = (prefix, n) => `${prefix}-${String(n).padStart(3, '0')}`;

// ── Real street-level bin locations in Kopargaon & Shirdi ────────────────────
const BIN_LOCATIONS = [
  // ── KOPARGAON (19.885°N, 74.478°E) ─────────────────────────────────────
  { binId: 'KOP-001', name: 'Kopargaon Bus Stand',          lat: 19.8871, lng: 74.4792, fill: 87 },
  { binId: 'KOP-002', name: 'Kopargaon Market Yard',        lat: 19.8854, lng: 74.4763, fill: 63 },
  { binId: 'KOP-003', name: 'Godavari River Bank',          lat: 19.8901, lng: 74.4810, fill: 34 },
  { binId: 'KOP-004', name: 'Kopargaon Municipal Office',   lat: 19.8842, lng: 74.4748, fill: 92 },
  { binId: 'KOP-005', name: 'Daityaguru Temple Road',       lat: 19.8864, lng: 74.4801, fill: 55 },
  { binId: 'KOP-006', name: 'Kopargaon Railway Station',    lat: 19.8830, lng: 74.4720, fill: 78 },
  { binId: 'KOP-007', name: 'Datta Par Site',               lat: 19.8912, lng: 74.4835, fill: 21 },
  { binId: 'KOP-008', name: 'Kopargaon Main Road',          lat: 19.8858, lng: 74.4775, fill: 95 },
  { binId: 'KOP-009', name: 'Kopargaon College Area',       lat: 19.8820, lng: 74.4755, fill: 47 },
  { binId: 'KOP-010', name: 'Kopargaon Hospital Junction',  lat: 19.8878, lng: 74.4788, fill: 70 },

  // ── SHIRDI (19.77°N, 74.48°E) ────────────────────────────────────────────
  { binId: 'SHR-001', name: 'Sai Baba Samadhi Mandir Gate', lat: 19.7653, lng: 74.4762, fill: 98 },
  { binId: 'SHR-002', name: 'Shirdi Bus Terminal',          lat: 19.7698, lng: 74.4801, fill: 82 },
  { binId: 'SHR-003', name: 'Sainagar Shirdi Railway Stn',  lat: 19.7721, lng: 74.4823, fill: 61 },
  { binId: 'SHR-004', name: 'Shirdi Pilgrim Reception Ctr', lat: 19.7645, lng: 74.4755, fill: 90 },
  { binId: 'SHR-005', name: 'Dwarkamai Mosque Road',        lat: 19.7660, lng: 74.4778, fill: 44 },
  { binId: 'SHR-006', name: 'Shirdi Main Market',           lat: 19.7675, lng: 74.4790, fill: 76 },
  { binId: 'SHR-007', name: 'Hotel Zone – Pimpalwadi Rd',   lat: 19.7710, lng: 74.4815, fill: 58 },
  { binId: 'SHR-008', name: 'Shri Sai Prasadalaya',         lat: 19.7649, lng: 74.4770, fill: 85 },
  { binId: 'SHR-009', name: 'Gurusthan Shrine Area',        lat: 19.7657, lng: 74.4768, fill: 29 },
  { binId: 'SHR-010', name: 'Wet N Joy Water Park Rd',      lat: 19.7738, lng: 74.4840, fill: 15 },
  { binId: 'SHR-011', name: 'Shirdi Airport Approach Rd',   lat: 19.7760, lng: 74.4690, fill: 53 },
  { binId: 'SHR-012', name: 'Chavadi Procession Route',     lat: 19.7663, lng: 74.4782, fill: 88 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  // Clear everything
  await Bin.deleteMany({});
  await Task.deleteMany({});
  await Reading.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️   Cleared existing data');

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const usersPayload = [
    // Admin — no zone
    { name: 'Admin User',       email: 'admin@smartwaste.com',   password: 'admin123', role: 'admin',    zone: null },
    // Kopargaon employees
    { name: 'Ravi Sharma',      email: 'ravi@smartwaste.com',    password: 'emp123',   role: 'employee', zone: 'kopargaon' },
    { name: 'Priya Deshmukh',   email: 'priya@smartwaste.com',   password: 'emp123',   role: 'employee', zone: 'kopargaon' },
    { name: 'Amit Kulkarni',    email: 'amit@smartwaste.com',    password: 'emp123',   role: 'employee', zone: 'kopargaon' },
    { name: 'Sunita Pawar',     email: 'sunita@smartwaste.com',  password: 'emp123',   role: 'employee', zone: 'kopargaon' },
    // Shirdi employees
    { name: 'Rohit Jadhav',     email: 'rohit@smartwaste.com',   password: 'emp123',   role: 'employee', zone: 'shirdi' },
    { name: 'Meena Patil',      email: 'meena@smartwaste.com',   password: 'emp123',   role: 'employee', zone: 'shirdi' },
    { name: 'Karan Bhosale',    email: 'karan@smartwaste.com',   password: 'emp123',   role: 'employee', zone: 'shirdi' },
  ];

  const users = [];
  for (const u of usersPayload) {
    const doc = new User(u);
    await doc.save(); // pre-save hook hashes the password
    users.push(doc);
  }
  const employees    = users.filter(u => u.role === 'employee');
  const kopEmployees = employees.filter(u => u.zone === 'kopargaon');
  const shrEmployees = employees.filter(u => u.zone === 'shirdi');
  console.log(`👤  Seeded ${users.length} users  (1 admin | ${kopEmployees.length} Kopargaon | ${shrEmployees.length} Shirdi employees)`);

  // ── 2. Bins ───────────────────────────────────────────────────────────────
  const binDocs = [];
  for (const loc of BIN_LOCATIONS) {
    const bin = new Bin({
      binId:          loc.binId,
      location:       { lat: loc.lat, lng: loc.lng },
      fillPercentage: loc.fill,
      // status auto-derived by Bin pre-save hook:
      //   <50 → Normal | 50-89 → Warning | >=90 → Critical   (config/thresholds.js)
      lastUpdated: new Date(Date.now() - rand(0, 3_600_000)),
    });
    await bin.save();
    binDocs.push(bin);
  }

  const critical = binDocs.filter(b => b.status === 'Critical');
  const warning  = binDocs.filter(b => b.status === 'Warning');
  const normal   = binDocs.filter(b => b.status === 'Normal');
  console.log(`📍  Seeded ${binDocs.length} bins — ${critical.length} Critical · ${warning.length} Warning · ${normal.length} Normal`);
  console.log(`    Kopargaon: ${binDocs.filter(b => b.binId.startsWith('KOP')).length} bins`);
  console.log(`    Shirdi:    ${binDocs.filter(b => b.binId.startsWith('SHR')).length} bins`);

  // ── 3. Tasks ──────────────────────────────────────────────────────────────
  // Zone-aware: KOP employees only get KOP bins, SHR employees only get SHR bins
  const kopBins = binDocs.filter(b => b.binId.startsWith('KOP'));
  const shrBins = binDocs.filter(b => b.binId.startsWith('SHR'));

  const tasks = [];
  let idx = 1;

  // Completed (historical — zone-matched)
  for (let i = 0; i < 6; i++) {
    tasks.push({
      taskId: pad('TASK', idx++), binId: pick(kopBins).binId,
      assignedEmployeeId: pick(kopEmployees)._id, status: 'Completed',
      timestamp: new Date(Date.now() - rand(1, 7) * 86_400_000),
    });
    tasks.push({
      taskId: pad('TASK', idx++), binId: pick(shrBins).binId,
      assignedEmployeeId: pick(shrEmployees)._id, status: 'Completed',
      timestamp: new Date(Date.now() - rand(1, 7) * 86_400_000),
    });
  }

  // In-Progress — 1 KOP critical + 1 SHR critical
  const kopCritical = kopBins.filter(b => b.status === 'Critical');
  const shrCritical = shrBins.filter(b => b.status === 'Critical');

  if (kopCritical[0]) tasks.push({ taskId: pad('TASK', idx++), binId: kopCritical[0].binId, assignedEmployeeId: pick(kopEmployees)._id, status: 'In-Progress', timestamp: new Date(Date.now() - rand(0, 7_200_000)) });
  if (kopCritical[1]) tasks.push({ taskId: pad('TASK', idx++), binId: kopCritical[1].binId, assignedEmployeeId: pick(kopEmployees)._id, status: 'In-Progress', timestamp: new Date(Date.now() - rand(0, 7_200_000)) });
  if (shrCritical[0]) tasks.push({ taskId: pad('TASK', idx++), binId: shrCritical[0].binId, assignedEmployeeId: pick(shrEmployees)._id, status: 'In-Progress', timestamp: new Date(Date.now() - rand(0, 7_200_000)) });

  // Pending — remaining critical + some warning, unassigned
  const pendingBins = [
    ...kopCritical.slice(2), ...kopBins.filter(b => b.status === 'Warning').slice(0, 2),
    ...shrCritical.slice(1), ...shrBins.filter(b => b.status === 'Warning').slice(0, 2),
  ];
  for (const bin of pendingBins) {
    tasks.push({ taskId: pad('TASK', idx++), binId: bin.binId, assignedEmployeeId: null, status: 'Pending', timestamp: new Date(Date.now() - rand(0, 1_800_000)) });
  }

  await Task.insertMany(tasks);
  console.log(`📋  Seeded ${tasks.length} tasks — ${tasks.filter(t=>t.status==='Completed').length} Completed · ${tasks.filter(t=>t.status==='In-Progress').length} In-Progress · ${tasks.filter(t=>t.status==='Pending').length} Pending`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seed complete! Locations: Kopargaon & Shirdi, Maharashtra');
  console.log('    Admin    →  admin@smartwaste.com  /  admin123');
  console.log('    Employee →  ravi@smartwaste.com   /  emp123');
  console.log('    Open     →  http://localhost:5173/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
