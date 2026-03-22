const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send email using Resend
const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'djblackkt2004@gmail.com', // ✅ Changed to your verified email
      to: to,
      subject: subject,
      html: html,
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }
    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

// Verify connection on startup
console.log('📧 Resend email service ready');

module.exports = { sendEmail };