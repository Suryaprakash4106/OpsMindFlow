const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,  // Changed from 465 to 587
  secure: false,  // Changed from true to false (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false  // Helps with Render network
  },
  connectionTimeout: 15000,  // 15 seconds timeout
  greetingTimeout: 15000,
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email server connection error:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

module.exports = transporter;