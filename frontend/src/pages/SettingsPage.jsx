import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FiArrowLeft, FiSun, FiMoon, FiEye, FiEyeOff, FiEdit2, FiUser, FiMail, FiLock,
} from 'react-icons/fi';

function PasswordInput({ label, value, onChange, show, onToggle, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef(null);

  // Profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && !editing) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, editing]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setProfileMsg({ type: '', text: '' });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!name.trim() || !email.trim()) {
      setProfileMsg({ type: 'error', text: 'Name and email are required' });
      return;
    }

    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name, email });
      setUser((prev) => ({ ...prev, ...data.user }));
      localStorage.setItem('userName', data.user.name);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
      setEditing(false);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwdMsg({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setPwdLoading(false);
    }
  };

  const msgClass = (type) =>
    type === 'success'
      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed';

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <nav className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  title="Go back"
                >
                  <FiArrowLeft size={20} />
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-white">OpsMindFlow - Settings</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl"
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>
                <span className="text-gray-700 dark:text-gray-300 hidden md:inline">Welcome, {user?.name}</span>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                        {user?.name}<br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                      </div>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate(isAdmin ? '/admin' : '/employee'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>

          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Information</h2>
              {!editing && (
                <button
                  onClick={() => { setEditing(true); setProfileMsg({ type: '', text: '' }); }}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  <FiEdit2 className="mr-2" /> Edit
                </button>
              )}
            </div>

            {profileMsg.text && (
              <div className={`p-3 rounded-lg mb-4 ${msgClass(profileMsg.type)}`}>{profileMsg.text}</div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="inline mr-2" />Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing || profileLoading}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiMail className="inline mr-2" />Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editing || profileLoading}
                  className={inputClass}
                  required
                />
              </div>

              {editing && (
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Account Details (read-only) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.status || 'active'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user?.createdAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user?.lastLogin)}</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              <FiLock className="inline mr-2" />Update Password
            </h2>

            {pwdMsg.text && (
              <div className={`p-3 rounded-lg mb-4 ${msgClass(pwdMsg.type)}`}>{pwdMsg.text}</div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                placeholder="Min 6 characters"
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
              />
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </main>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Logout</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to logout?</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}