const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Username must be at least 2 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'TEACHER', 'STUDENT'],
    required: [true, 'Role is required']
  },
  password: {
    type: String,
    required: function () {
      return this.role !== 'STUDENT';
    },
    validate: {
      validator: function (v) {
        // Skip validation if password is not being set or is empty
        if (!v || v === '') return true;
        // Skip if it looks like a bcrypt hash (starts with $2)
        if (v.startsWith('$2')) return true;
        return v.length >= 2 && v.length <= 16;
      },
      message: 'Password must be between 2 and 16 characters long'
    }
  },
  // Student & Teacher metadata
  admissionNo: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function (v) {
        // Only validate if value is provided
        if (!v || v === '') return true;
        return /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        // Only validate if value is provided
        if (!v || v === '') return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  dob: {
    type: Date
  },
  category: {
    type: String,
    enum: ['General', 'OBC', 'OEC', 'SC', 'ST']
  },
  caste: {
    type: String,
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  transportMode: {
    type: String,
    enum: ['School Bus', 'Private Bus', 'Govt. Bus', 'Auto', 'Jeep', 'Bicycle', 'Two Wheeler', 'Car', 'Cab', 'By Walk']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassRoom',
    required: function () {
      return this.role === 'STUDENT';
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

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform _id to id for frontend compatibility
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Don't send password to frontend
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
