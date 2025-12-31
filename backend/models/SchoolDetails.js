const mongoose = require('mongoose');

const schoolDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  place: {
    type: String,
    required: [true, 'School place is required'],
    trim: true
  },
  schoolCode: {
    type: String,
    required: [true, 'School code is required'],
    trim: true,
    uppercase: true
  },
  headMasterName: {
    type: String,
    required: [true, 'Head master name is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  reportLanguages: {
    type: [String],
    default: ['English', 'Tamil']
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

module.exports = mongoose.model('SchoolDetails', schoolDetailsSchema);