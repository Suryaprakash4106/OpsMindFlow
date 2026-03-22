const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'prakashkt2004@gmail.com', // ✅ Your Resend verified email
      to: to,
      subject: subject,
      html: html,
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }
    console.log('✅ Email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
};

module.exports = { sendEmail };