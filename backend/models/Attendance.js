const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  percentage: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        if (v === '') return true;
        const num = parseFloat(v);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      message: 'Attendance percentage must be between 0 and 100'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique attendance per student per exam
attendanceSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);