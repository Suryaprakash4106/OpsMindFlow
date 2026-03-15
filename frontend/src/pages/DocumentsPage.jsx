import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiFileText, FiCalendar, FiClock, FiSun, FiMoon, FiArrowLeft } from 'react-icons/fi';

export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const userMenuRef = useRef(null);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Close dropdown on outside click
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
    const fetchPdfs = async () => {
      try {
        const { data } = await api.get('/pdf/list');
        setPdfList(data);
      } catch (err) {
        console.error('Failed to fetch PDFs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPdfs();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Safe date formatter – never shows "Invalid Date"
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <nav className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-4">
                {/* Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  title="Go back"
                >
                  <FiArrowLeft size={20} />
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-white">OpsMindFlow - Documents</span>
              </div>
              <div className="flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl"
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>

                {/* Welcome message */}
                <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.name}</span>

                {/* Profile Dropdown */}
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
                        {user?.name}<br/>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                      </div>
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
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

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">All SOP Documents</h1>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
          ) : pdfList.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pdfList.map((pdf) => {
                // Use uploadDate if available, otherwise fallback to createdAt
                const dateStr = pdf.uploadDate || pdf.createdAt;
                const displayDate = formatDate(dateStr);
                const displayTime = formatTime(dateStr);

                return (
                  <div
                    key={pdf._id}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-all duration-300 hover:scale-105 hover:border-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.3)] cursor-pointer flex flex-col items-center text-center"
                    onClick={() => {
                      navigate('/chat', { state: { selectedPdf: pdf } });
                    }}
                  >
                    <FiFileText className="text-5xl text-blue-500 dark:text-blue-400 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors" />
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white truncate w-full">{pdf.fileName}</h2>
                    {displayDate && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <FiCalendar className="mr-1" />
                        {displayDate}
                      </div>
                    )}
                    {displayTime && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiClock className="mr-1" />
                        {displayTime}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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