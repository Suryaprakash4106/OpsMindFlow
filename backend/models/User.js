const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String }, // required false – will be set after OTP
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ['admin', 'employee', 'traffic_police', 'police'],
      default: 'employee',
    },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpires: Date,
    googleId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    
    // User status (blocked by admin)
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    
    // Online/offline tracking
    isActive: { type: Boolean, default: false }, // true when logged in
    lastSeen: { type: Date }, // last activity timestamp
    
    lastLogin: { type: Date },
    loginHistory: [{
      timestamp: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
      logoutTime: Date, // when they logged out
    }],
    
    tempData: {
      firstName: String,
      lastName: String,
      otp: String,
      otpExpires: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);