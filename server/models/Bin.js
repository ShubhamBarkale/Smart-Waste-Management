const mongoose = require('mongoose');
const { getStatus, nextAlertLevel } = require('../config/thresholds');

const BinSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: [true, 'Bin ID is required'],
      unique: true,
      trim: true,
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180,
      },
    },
    fillPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Normal', 'Warning', 'Critical'],
      default: 'Normal',
    },
    // Highest alert level already raised for this bin: 0 | 50 | 60 | 90
    alertLevel: {
      type: Number,
      enum: [0, 50, 60, 90],
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * Derive status + alert level from fillPercentage before saving.
 * Thresholds live in config/thresholds.js (50 / 60 / 90).
 */
BinSchema.pre('save', function (next) {
  this.status = getStatus(this.fillPercentage);
  this.alertLevel = nextAlertLevel(this.fillPercentage, this.alertLevel ?? 0);
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Bin', BinSchema);
