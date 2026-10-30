const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: [true, 'Task ID is required'],
      unique: true,
      trim: true,
    },
    binId: {
      type: String,
      required: [true, 'Bin ID is required'],
      ref: 'Bin',
    },
    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Completed'],
      default: 'Pending',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
