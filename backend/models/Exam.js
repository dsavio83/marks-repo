const mongoose = require('mongoose');

const examSubjectConfigSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  maxTe: {
    type: Number,
    required: [true, 'Maximum TE marks is required'],
    min: [0, 'Maximum TE marks cannot be negative']
  },
  maxCe: {
    type: Number,
    required: [true, 'Maximum CE marks is required'],
    min: [0, 'Maximum CE marks cannot be negative']
  },
  included: {
    type: Boolean,
    default: true
  }
});

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassRoom',
    required: [true, 'Class ID is required']
  },
  subjectConfigs: {
    type: [examSubjectConfigSchema],
    required: [true, 'Subject configurations are required'],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one subject configuration is required'
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

// Transform _id to id for frontend compatibility
examSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Exam', examSchema);