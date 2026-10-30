// Bin IDs start with a zone prefix (KOP-001, SHR-004 …)
const ZONE_BY_PREFIX = { KOP: 'kopargaon', SHR: 'shirdi' };

const zoneForBin = (binId) =>
  ZONE_BY_PREFIX[String(binId || '').split('-')[0].toUpperCase()] || null;

module.exports = { ZONE_BY_PREFIX, zoneForBin };
