const User = require('../models/User');

// Helper function to extract user from header token
const getUserFromHeader = async (req) => {
  const sessionHeader = req.headers['x-session-id'];
  const userIdHeader = req.headers['x-user-id'];
  
  console.log('🔑 Header auth check:', { 
    path: req.path,
    hasSessionHeader: !!sessionHeader, 
    hasUserIdHeader: !!userIdHeader,
    sessionHeaderPreview: sessionHeader ? sessionHeader.substring(0, 10) + '...' : null,
    userIdHeader: userIdHeader
  });
  
  if (!sessionHeader || !userIdHeader) {
    console.log('❌ Missing headers');
    return null;
  }
  
  try {
    console.log('🔄 Decoding token...');
    // Decode the base64 token (userId:timestamp)
    const decoded = atob(sessionHeader);
    console.log('✅ Decoded token:', decoded);
    
    const [userId, timestamp] = decoded.split(':');
    console.log('📊 Extracted - userId:', userId, 'timestamp:', timestamp);
    
    // Check if token is expired (optional - 24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    console.log('⏰ Token age:', tokenAge / (1000 * 60 * 60), 'hours');
    
    if (tokenAge > 24 * 60 * 60 * 1000) {
      console.log('❌ Token expired');
      return null;
    }
    
    // Verify userId matches header
    if (userId !== userIdHeader) {
      console.log('❌ User ID mismatch:', { tokenUserId: userId, headerUserId: userIdHeader });
      return null;
    }
    
    console.log('🔍 Looking up user in database...');
    // Get user from database
    const user = await User.findById(userId);
    console.log('✅ User found:', user ? user.email : 'Not found');
    return user;
  } catch (error) {
    console.error('❌ Header auth error:', error.message);
    return null;
  }
};

// Check if user is authenticated (supports both session and header)
exports.isAuthenticated = async (req, res, next) => {
  console.log('\n🔐 ===== AUTH CHECK =====');
  console.log('🔐 Path:', req.path);
  console.log('🔐 Method:', req.method);
  console.log('🔐 Session exists:', !!req.session);
  console.log('🔐 Session ID:', req.sessionID);
  console.log('🔐 User ID in session:', req.session?.userId);
  
  // Check session first (original method)
  if (req.session && req.session.userId) {
    console.log('✅ Session auth successful for user:', req.session.userId);
    req.authMethod = 'session';
    return next();
  }
  
  console.log('🔄 No session, checking headers...');
  // Check custom header as fallback (new method)
  const user = await getUserFromHeader(req);
  if (user) {
    console.log('✅ Header auth successful for user:', user._id);
    // Attach user to request for downstream use
    req.user = user;
    req.userId = user._id;
    req.authMethod = 'header';
    return next();
  }
  
  console.log('❌ Authentication failed - no session or valid headers');
  console.log('🔐 ===== AUTH FAILED =====\n');
  res.status(401).json({ error: 'Not authenticated' });
};

// Check if user is admin (supports both methods)
exports.isAdmin = async (req, res, next) => {
  console.log('👑 Admin check for path:', req.path);
  
  try {
    let user = null;
    
    // Check session first
    if (req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
      console.log('👑 User from session:', user?.email);
    } 
    // Check if user was attached from header
    else if (req.user) {
      user = req.user;
      console.log('👑 User from header:', user?.email);
    }
    
    if (user && user.role === 'admin') {
      console.log('👑 Admin access granted');
      return next();
    }
    
    console.log('👑 Admin access denied - role:', user?.role);
    res.status(403).json({ error: 'Access denied. Admins only.' });
  } catch (error) {
    console.error('👑 Admin check error:', error);
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