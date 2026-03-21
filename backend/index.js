require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = 'https://opsmindflow.vercel.app';

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🔥 CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID, X-User-ID');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ✅ OPTIONS handler for all routes (FIXES 405 ERROR)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID, X-User-ID');
  res.sendStatus(200);
});

// ✅ Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'opsmind_secret',
  resave: false,
  saveUninitialized: true,
  name: 'connect.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    domain: '.onrender.com'
  }
}));

// 🆕 SESSION DEBUGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log('\n' + '='.repeat(50));
  console.log('🍪 SESSION DEBUG at:', new Date().toISOString());
  console.log('🍪 Request path:', req.path);
  console.log('🍪 Session ID:', req.sessionID);
  console.log('🍪 Session exists:', !!req.session);
  console.log('🍪 User ID in session:', req.session?.userId);
  console.log('🍪 Cookie header:', req.headers.cookie);
  console.log('='.repeat(50) + '\n');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
});