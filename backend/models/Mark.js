const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  teMark: {
    type: String,
    required: [true, 'TE mark is required'],
    validate: {
      validator: function (v) {
        return /^\d+(\.\d{1,2})?$/.test(v);
      },
      message: 'TE mark must be a valid number'
    }
  },
  ceMark: {
    type: String,
    required: [true, 'CE mark is required'],
    validate: {
      validator: function (v) {
        return /^\d+(\.\d{1,2})?$/.test(v);
      },
      message: 'CE mark must be a valid number'
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

// Compound index to ensure unique marks per student per subject per exam
markSchema.index({ studentId: 1, subjectId: 1, examId: 1 }, { unique: true });

// Transform _id to id for frontend compatibility
markSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Mark', markSchema);