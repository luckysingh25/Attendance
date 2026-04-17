const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  erp: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true, 
  },
  course: {
    type: String,
  },
  section: {
    type: String,
  },
  photoUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Student', studentSchema);
