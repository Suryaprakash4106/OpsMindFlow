import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUser, FiMail, FiCalendar, FiClock, FiEye, FiLock, FiUnlock, FiSun, FiMoon, FiX, FiLogIn, FiLogOut } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalDocs: 0, totalEmployees: 0 });
  const [users, setUsers] = useState([]);
  const [loginStats, setLoginStats] = useState([]);
  const [totals, setTotals] = useState({ totalUsers: 0, activeNow: 0, blockedUsers: 0, todayLogins: 0 });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  const [blockAction, setBlockAction] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const userMenuRef = useRef(null);
  const tableRef = useRef(null);

  // Modal state for user details
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, loginStatsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/login-stats')
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setLoginStats(loginStatsRes.data.stats);
        setTotals(loginStatsRes.data.totals);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      }
    };
    fetchData();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle block/unblock click (opens custom modal)
  const handleBlockClick = (userId, currentStatus) => {
    const action = currentStatus === 'blocked' ? 'unblock' : 'block';
    setSelectedUserForBlock({ id: userId, currentStatus });
    setBlockAction(action);
    setShowBlockConfirm(true);
  };

  // Confirm block/unblock action
  const confirmBlockAction = async () => {
    if (!selectedUserForBlock) return;
    
    setShowBlockConfirm(false);
    try {
      await api.patch(`/admin/users/${selectedUserForBlock.id}/${blockAction}`);
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      setSelectedUserForBlock(null);
      setBlockAction('');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Open modal and fetch user details
  const handleViewUser = async (userId) => {
    setShowUserModal(true);
    setModalLoading(true);
    setModalError('');
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      // Ensure loginHistory is an array
      if (!data.loginHistory) data.loginHistory = [];
      setSelectedUser(data);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to load user details');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setModalError('');
  };

  // Format helpers
  const formatDateTime = (date) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';
    
    // OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return `${browser} on ${os}`;
  };

  // Helper to get status badge based on user data
  const getStatusBadge = (user) => {
    if (user.status === 'blocked') {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>;
    } else if (user.isActive) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    } else {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <nav className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-4">
                <span className="text-xl font-bold text-gray-800 dark:text-white">OpsMindFlow</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
                <button onClick={scrollToTable} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  User Management
                </button>
                <button onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl">
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 hidden md:inline">{user?.name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                        {user?.name}<br/>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                      </div>
                      <button onClick={() => { setShowUserMenu(false); navigate('/admin/settings'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Settings
                      </button>
                      <button onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Admin Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDocs}</div>
              <div className="text-gray-600 dark:text-gray-400">Total SOPs</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="text-2xl font-bold text-green-600">{stats.totalEmployees}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Employees</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="text-2xl font-bold text-purple-600">{totals.totalUsers}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="text-2xl font-bold text-yellow-600">{totals.activeNow}</div>
              <div className="text-gray-600 dark:text-gray-400">Active Now</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="text-2xl font-bold text-red-600">{totals.blockedUsers}</div>
              <div className="text-gray-600 dark:text-gray-400">Blocked Users</div>
            </div>
          </div>

          {/* Login Activity Graph */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Login Activity (Last 7 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Management Table */}
          <div ref={tableRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Registered Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="mr-2 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiMail className="mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500 dark:text-gray-300">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(u)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.lastLogin && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                            <FiCalendar className="mr-1" />
                            {new Date(u.lastLogin).toLocaleDateString()}
                            <FiClock className="ml-2 mr-1" />
                            {new Date(u.lastLogin).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewUser(u._id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="View"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleBlockClick(u._id, u.status)}
                          className={u.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={u.status === 'active' ? 'Block' : 'Unblock'}
                        >
                          {u.status === 'active' ? <FiLock size={18} /> : <FiUnlock size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Link to="/chat" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Chat Interface</h2>
              <p className="text-gray-600 dark:text-gray-400">Test the AI assistant</p>
            </Link>
            <Link to="/admin/upload" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">📤</div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Upload PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Add new SOPs to the knowledge base</p>
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
                <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Cancel
                </button>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block/Unblock Confirmation Modal */}
        {showBlockConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm {blockAction === 'block' ? 'Block' : 'Unblock'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to {blockAction} this user?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockAction}
                  className={`px-4 py-2 rounded-lg text-white transition ${
                    blockAction === 'block' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {blockAction === 'block' ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Activity - {selectedUser?.name}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {modalLoading ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
                ) : modalError ? (
                  <p className="text-center text-red-600">{modalError}</p>
                ) : selectedUser ? (
                  <>
                    {/* User Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">NAME</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.name}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">EMAIL</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{selectedUser.email}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROLE</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedUser.role}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">STATUS</p>
                        {getStatusBadge(selectedUser)}
                      </div>
                    </div>

                    {/* Login History Table */}
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Login Activity</h3>
                    {!selectedUser.loginHistory || selectedUser.loginHistory.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No login history available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TIME</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTION</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP ADDRESS</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DEVICE</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {selectedUser.loginHistory.map((entry, idx) => {
                              return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {formatDateTime(entry.timestamp)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      <FiLogIn className="mr-1" size={12} />
                                      Login
                                    </span>
                                    {entry.logoutTime && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ml-2">
                                        <FiLogOut className="mr-1" size={12} />
                                        Logout
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {entry.ip || 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {getDeviceInfo(entry.userAgent)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">No user data</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}