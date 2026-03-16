const User = require('../models/User');

// Helper function to extract user from header token
const getUserFromHeader = async (req) => {
  const sessionHeader = req.headers['x-session-id'];
  const userIdHeader = req.headers['x-user-id'];
  
  if (!sessionHeader || !userIdHeader) return null;
  
  try {
    // Decode the base64 token (userId:timestamp)
    const decoded = atob(sessionHeader);
    const [userId, timestamp] = decoded.split(':');
    
    // Check if token is expired (optional - 24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return null; // Token expired
    }
    
    // Verify userId matches header
    if (userId !== userIdHeader) return null;
    
    // Get user from database
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('Header auth error:', error);
    return null;
  }
};

// Check if user is authenticated (supports both session and header)
exports.isAuthenticated = async (req, res, next) => {
  // Check session first (original method)
  if (req.session && req.session.userId) {
    req.authMethod = 'session';
    return next();
  }
  
  // Check custom header as fallback (new method)
  const user = await getUserFromHeader(req);
  if (user) {
    // Attach user to request for downstream use
    req.user = user;
    req.userId = user._id;
    req.authMethod = 'header';
    return next();
  }
  
  res.status(401).json({ error: 'Not authenticated' });
};

// Check if user is admin (supports both methods)
exports.isAdmin = async (req, res, next) => {
  try {
    let user = null;
    
    // Check session first
    if (req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
    } 
    // Check if user was attached from header
    else if (req.user) {
      user = req.user;
    }
    
    if (user && user.role === 'admin') {
      return next();
    }
    
    res.status(403).json({ error: 'Access denied. Admins only.' });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Optional: Get current user from request (for controllers)
exports.getCurrentUser = (req) => {
  if (req.session && req.session.userId) {
    return { id: req.session.userId, method: 'session' };
  }
  if (req.user) {
    return { id: req.user._id, method: 'header', user: req.user };
  }
  return null;
};