const mongoose = require('mongoose');

// One document per sensor reading → history for charts / predictions.
// Auto-deleted after 90 days so the collection does not grow forever.
const ReadingSchema = new mongoose.Schema({
  binId: { type: String, required: true },
  fillPercentage: { type: Number, required: true, min: 0, max: 100 },
  source: { type: String, enum: ['device', 'manual'], default: 'device' },
  timestamp: { type: Date, default: Date.now, expires: '90d' },
});
ReadingSchema.index({ binId: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', ReadingSchema);
