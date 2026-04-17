const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  erp: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
  },
  eventId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  verifiedBy: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
});

attendanceSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
