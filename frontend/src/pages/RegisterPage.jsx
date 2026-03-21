import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: details, 2: otp, 3: password
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    
    // Show "Sending..." message to user
    setMessage('Sending OTP to your email...');
    
    try {
      const response = await api.post('/auth/send-otp', { firstName, lastName, email });
      setMessage('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter OTP');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('Verifying OTP...');
    
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setMessage('OTP verified successfully!');
      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('Creating your account...');
    
    try {
      await api.post('/auth/complete-registration', {
        email,
        password,
        role,
      });
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('Resending OTP...');
    try {
      await api.post('/auth/send-otp', { firstName, lastName, email });
      setMessage('OTP resent successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      {/* Glass card */}
      <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Create Account</h2>

        {error && (
          <div className="bg-red-500/80 text-white p-3 rounded-lg mb-4 animate-pulse">{error}</div>
        )}
        {message && (
          <div className="bg-green-500/80 text-white p-3 rounded-lg mb-4">{message}</div>
        )}

        {/* Step 1: Name & Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="John"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="123456"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-white/70 text-xs mt-1">Check your email for OTP</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-white/80 hover:text-white text-sm underline"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="text-white/80 hover:text-white text-sm underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password & Role */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="•••••••• (min 6 characters)"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                disabled={loading}
              >
                <option value="employee" className="text-gray-800">Employee</option>
              </select>
              <p className="text-white/70 text-xs mt-1">All new users are registered as employees</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-white/80">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}