import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiUpload, FiTrash2, FiPlus, FiSun, FiMoon, FiUser, FiArrowLeft } from 'react-icons/fi';

export default function UploadPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pdfList, setPdfList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const userMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch PDF list
  const fetchPdfs = async () => {
    try {
      const { data } = await api.get('/pdf/list');
      setPdfList(data);
    } catch (err) {
      console.error('Failed to fetch PDFs', err);
    }
  };

  useEffect(() => {
    fetchPdfs();
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    setUploading(true);
    setMessage('');

    try {
      await api.post('/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Upload successful!');
      setSelectedFile(null);
      fetchPdfs(); // Refresh list
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;
    try {
      await api.delete(`/pdf/${id}`);
      fetchPdfs();
    } catch (err) {
      alert('Failed to delete PDF');
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const goBack = () => {
    navigate(-1); // Navigate to previous page
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Left Sidebar – PDF List */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {/* Back button */}
          <button
            onClick={goBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <FiArrowLeft className="mr-2" size={20} />
            <span>Back</span>
          </button>

          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Uploaded PDFs</h2>
          {pdfList.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No PDFs uploaded yet</p>
          ) : (
            <ul className="space-y-2">
              {pdfList.map(pdf => (
                <li key={pdf._id} className="group relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pdf.fileName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(pdf.uploadDate).toLocaleDateString()} • {new Date(pdf.uploadDate).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(pdf._id)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side – Upload Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-md py-3 px-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Upload SOP</h1>
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl"
              >
                {darkMode ? <FiSun /> : <FiMoon />}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 hidden md:inline">{user?.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                      {user?.name}<br />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
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
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-white">
                  Upload New SOP
                </h2>

                <form onSubmit={handleUpload} className="space-y-6">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    id="file-upload"
                  />

                  {/* Large upload area */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition"
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FiUpload className="mx-auto text-4xl text-blue-500" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FiPlus className="mx-auto text-5xl text-gray-400 dark:text-gray-500" />
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                          Click to select a PDF file
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          or drag and drop
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload and Cancel buttons */}
                  {selectedFile && (
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? 'Uploading...' : 'Upload PDF'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={uploading}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Status message */}
                  {message && (
                    <div className={`text-center p-3 rounded-lg ${
                      message.includes('success') 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>

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
  );
}