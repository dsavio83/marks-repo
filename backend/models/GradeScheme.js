const mongoose = require('mongoose');

const gradeBoundarySchema = new mongoose.Schema({
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E'],
    uppercase: true
  },
  minPercent: {
    type: Number,
    required: [true, 'Minimum percentage is required'],
    min: [0, 'Minimum percentage cannot be less than 0'],
    max: [100, 'Minimum percentage cannot exceed 100']
  }
});

const gradeSchemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Grade scheme name is required'],
    trim: true
  },
  applicableClasses: {
    type: [String],
    required: [true, 'Applicable classes are required'],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one applicable class is required'
    }
  },
  boundaries: {
    type: [gradeBoundarySchema],
    required: [true, 'Grade boundaries are required'],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one grade boundary is required'
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
gradeSchemeSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('GradeScheme', gradeSchemeSchema);