const User = require('../models/User');
const Document = require('../models/Document');
const bcrypt = require('bcrypt');
const { sanitizeUser } = require('../utils/helpers');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Add a new employee
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      isVerified: true,
      isActive: false,
    });
    await user.save();

    res.status(201).json({ message: 'Employee added', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Add employee error:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

// Remove an employee
exports.removeEmployee = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Remove employee error:', error);
    res.status(500).json({ error: 'Failed to remove employee' });
  }
};

// ✅ FIXED: Get dashboard statistics with debug logs
exports.getStats = async (req, res) => {
  try {
    // Log database name
    console.log('📁 Connected to database:', mongoose.connection.name);
    
    // Count documents
    const totalDocs = await Document.countDocuments();
    console.log('📊 Documents found:', totalDocs);
    
    // Count employees
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    console.log('👥 Employees found:', totalEmployees);
    
    // Send response
    res.json({ totalDocs, totalEmployees });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get all users with details
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -otp -otpExpires -tempData')
      .sort({ createdAt: -1 });
    
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      let displayStatus = 'active';
      if (userObj.status === 'blocked') {
        displayStatus = 'blocked';
      } else if (!userObj.isActive) {
        displayStatus = 'inactive';
      }
      return { ...userObj, displayStatus, currentStatus: displayStatus };
    });
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.status = 'blocked';
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.status = 'active';
    await user.save();
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Get login statistics
exports.getLoginStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await User.aggregate([
      { $unwind: '$loginHistory' },
      { $match: { 'loginHistory.timestamp': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$loginHistory.timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const formatted = stats.map(s => ({
      date: s._id.date,
      logins: s.count
    }));

    const activeNow = await User.countDocuments({ isActive: true, status: 'active' });
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ status: 'blocked' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayLogins = await User.countDocuments({
      'loginHistory.timestamp': { $gte: today, $lt: tomorrow }
    });

    res.json({
      stats: formatted,
      totals: { totalUsers, activeNow, blockedUsers, todayLogins }
    });
  } catch (error) {
    console.error('Login stats error:', error);
    res.status(500).json({ error: 'Failed to fetch login stats' });
  }
};

// Get single user details
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpires -tempData')
      .lean();
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let displayStatus = 'active';
    if (user.status === 'blocked') {
      displayStatus = 'blocked';
    } else if (!user.isActive) {
      displayStatus = 'inactive';
    }
    
    res.json({ ...user, loginHistory: user.loginHistory || [], displayStatus });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};