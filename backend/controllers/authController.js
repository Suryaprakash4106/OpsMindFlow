const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateOTP, sanitizeUser } = require('../utils/helpers');
const transporter = require('../config/email');

// Register new user (original single‑step method – keep for compatibility)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      otp,
      otpExpires,
      isActive: false, // new users start as inactive
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your OTP - OpsMindFlow',
      html: `<p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.status(201).json({ message: 'Registration successful. Please verify OTP.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Step 1: Send OTP (new multi‑step flow)
exports.sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, isActive: false });
    }
    user.tempData = { firstName, lastName, otp, otpExpires };
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP - OpsMindFlow',
      html: `<p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Step 2: Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.tempData) {
      return res.status(400).json({ error: 'No pending registration found' });
    }

    if (user.tempData.otp !== otp || user.tempData.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Step 3: Complete registration (set password and role)
exports.completeRegistration = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.tempData) {
      return res.status(400).json({ error: 'No pending registration found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.name = `${user.tempData.firstName} ${user.tempData.lastName}`;
    user.password = hashedPassword;
    user.role = role || 'employee';
    user.isVerified = true;
    user.tempData = undefined;
    user.isActive = false; // user starts as inactive
    await user.save();

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact admin.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses social login. Please use Google/GitHub.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    // Update online status and login history
    user.isActive = true;
    user.lastSeen = new Date();
    user.lastLogin = new Date();
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;

    res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Verify OTP (original single‑step method)
exports.verifyOtpOriginal = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Resend OTP (original)
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New OTP - OpsMindFlow',
      html: `<p>Your new OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Update user status before destroying session
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        user.isActive = false;
        user.lastSeen = new Date();
        
        // Find the last login entry without logout time and update it
        const lastLogin = user.loginHistory
          .filter(entry => !entry.logoutTime)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (lastLogin) {
          lastLogin.logoutTime = new Date();
        }
        
        await user.save();
      }
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password -otp -otpExpires -tempData');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};