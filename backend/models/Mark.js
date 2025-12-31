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
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d+(\.\d{1,2})?$/.test(v) || v === 'A';
      },
      message: 'TE mark must be a valid number or "A" for Absent'
    }
  },
  ceMark: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d+(\.\d{1,2})?$/.test(v) || v === 'A';
      },
      message: 'CE mark must be a valid number or "A" for Absent'
    }
  },
  detailedMarks: [{
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  isLocked: {
    type: Boolean,
    default: false
  },
  aiAnalysis: {
    type: String,
    default: ''
  },
  aiAdvice: {
    type: String,
    default: ''
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