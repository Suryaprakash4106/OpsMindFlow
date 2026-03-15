import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <nav className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <span className="text-xl font-bold text-gray-800 dark:text-white">OpsMindFlow</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl"
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>
                <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.name}</span>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">Employee Dashboard</h1>

          {/* Cards stacked vertically, centered, with increased size */}
          <div className="flex flex-col items-center gap-10">
            {/* Ask AI Assistant Card */}
            <Link
              to="/chat"
              className="group w-full max-w-2xl bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md transition-all duration-300 hover:scale-105 hover:border-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.3)] text-center flex flex-col items-center"
            >
              <div className="text-6xl mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">💬</div>
              <h2 className="text-3xl font-semibold mb-3 text-gray-800 dark:text-white">Ask AI Assistant</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Get instant answers from SOPs</p>
            </Link>

            {/* Recent Documents Card */}
            <Link
              to="/documents"
              className="group w-full max-w-2xl bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md transition-all duration-300 hover:scale-105 hover:border-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.3)] text-center flex flex-col items-center"
            >
              <div className="text-6xl mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">📄</div>
              <h2 className="text-3xl font-semibold mb-3 text-gray-800 dark:text-white">Recent Documents</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">View all available SOPs</p>
            </Link>
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