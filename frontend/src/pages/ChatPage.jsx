import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiArrowLeft } from 'react-icons/fi'; // Import back icon

// Icons (you can replace with react-icons)
const CopyIcon = () => <span>📋</span>;
const RegenerateIcon = () => <span>🔄</span>;
const SendIcon = () => <span>➤</span>;
const SearchIcon = () => <span>🔍</span>;
const NewChatIcon = () => <span>➕</span>;
const SunIcon = () => <span>☀️</span>;
const MoonIcon = () => <span>🌙</span>;

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pdfList, setPdfList] = useState([]);
  const [pdfSearch, setPdfSearch] = useState('');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showPdfDropdown, setShowPdfDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const messagesEndRef = useRef(null);
  const pdfDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`chatConvs_${user._id}`);
    if (saved) {
      const convs = JSON.parse(saved);
      setConversations(convs);
      // Load the most recent conversation, if any
      if (convs.length > 0) {
        const latest = convs.sort((a, b) => b.timestamp - a.timestamp)[0];
        setMessages(latest.messages);
        setCurrentConvId(latest.id);
      } else {
        startNewChat();
      }
    } else {
      startNewChat();
    }
  }, [user]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`chatConvs_${user._id}`, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  // Sync current conversation's messages into the conversations array
  useEffect(() => {
    if (!currentConvId) return;
    // Update the conversation with the latest messages
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConvId
          ? { ...conv, messages: messages, timestamp: Date.now() }
          : conv
      )
    );
  }, [messages]); // runs every time messages change

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch PDF list
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const { data } = await api.get('/pdf/list');
        setPdfList(data);
      } catch (err) {
        console.error('Failed to fetch PDFs', err);
      }
    };
    fetchPdfs();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target)) {
        setShowPdfDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startNewChat = () => {
    // Create a new conversation
    const newConv = {
      id: Date.now(),
      timestamp: Date.now(),
      messages: [],
      title: 'New Chat'
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConvId(newConv.id);
    setMessages([]);
  };

  const loadConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setMessages(conv.messages);
      setCurrentConvId(convId);
      setShowHistory(false);
    }
  };

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== convId);
    setConversations(updated);
    if (convId === currentConvId) {
      if (updated.length > 0) {
        loadConversation(updated[0].id);
      } else {
        startNewChat();
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user', timestamp: new Date().toLocaleTimeString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // If this is the first message in this conversation, update the title
    if (messages.length === 0) {
      const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConvId ? { ...conv, title } : conv
        )
      );
    }

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, text: '', sender: 'ai', timestamp: '', loading: true }]);

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          documentId: selectedPdf?._id
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                aiText += parsed.token;
                setMessages(prev => prev.map(m => 
                  m.id === aiMsgId ? { ...m, text: aiText, timestamp: new Date().toLocaleTimeString(), loading: false } : m
                ));
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, text: 'Error: Failed to get response', timestamp: new Date().toLocaleTimeString(), loading: false } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = (aiMessageId) => {
    const index = messages.findIndex(m => m.id === aiMessageId);
    if (index > 0 && messages[index-1].sender === 'user') {
      const question = messages[index-1].text;
      setMessages(prev => prev.filter(m => m.id !== aiMessageId));
      setInput(question);
      setTimeout(() => sendMessage(), 100);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const filteredPdfs = pdfList.filter(pdf => 
    pdf.fileName.toLowerCase().includes(pdfSearch.toLowerCase())
  );

  const handlePdfSelect = (pdf) => {
    setSelectedPdf(pdf);
    setShowPdfDropdown(false);
  };

  const handleUserMenuOption = (option) => {
    setShowUserMenu(false);
    if (option === 'dashboard') {
      navigate(user?.role === 'admin' ? '/admin' : '/employee');
    } else if (option === 'logout') {
      setShowLogoutConfirm(true); // Show confirmation instead of immediate logout
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const goBack = () => {
    navigate(-1); // Navigate to previous page
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white">Chats</h3>
              <button
                onClick={startNewChat}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="New Chat"
              >
                <NewChatIcon />
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No chats yet</p>
            ) : (
              conversations.sort((a,b) => b.timestamp - a.timestamp).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer mb-2 flex justify-between items-center ${
                    conv.id === currentConvId ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate dark:text-white">
                      {conv.title || 'New Chat'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conv.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-md py-3 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back button added here */}
              <button
                onClick={goBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Go back"
              >
                <FiArrowLeft size={20} />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ☰
              </button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">OpsMindFlow</h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* Dashboard Link */}
              <a
                href={user?.role === 'admin' ? '/admin' : '/employee'}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Dashboard
              </a>

              {/* PDF List Dropdown */}
              <div className="relative" ref={pdfDropdownRef}>
                <button
                  onClick={() => setShowPdfDropdown(!showPdfDropdown)}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                >
                  PDF List
                  <span className="ml-1">▼</span>
                </button>
                {showPdfDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10 border border-gray-200 dark:border-gray-700">
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search PDFs..."
                        value={pdfSearch}
                        onChange={(e) => setPdfSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md pl-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="absolute left-2 top-2.5 text-gray-400">
                        <SearchIcon />
                      </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                      {filteredPdfs.map(pdf => (
                        <li
                          key={pdf._id}
                          className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded ${
                            selectedPdf?._id === pdf._id ? 'bg-blue-100 dark:bg-blue-900' : ''
                          }`}
                          onClick={() => handlePdfSelect(pdf)}
                        >
                          <div className="font-medium truncate dark:text-white">{pdf.fileName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(pdf.uploadDate).toLocaleDateString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* User Profile */}
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
                      {user?.name}<br/>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                    </div>
                    <button
                      onClick={() => handleUserMenuOption('dashboard')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleUserMenuOption('logout')}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-xl px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="absolute -left-8 top-2 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                      AI
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                  {msg.timestamp && (
                    <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                      {msg.timestamp}
                    </div>
                  )}
                  {msg.sender === 'ai' && !msg.loading && msg.text && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleCopy(msg.text)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                      >
                        <CopyIcon /> Copy
                      </button>
                      <button
                        onClick={() => handleRegenerate(msg.id)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                      >
                        <RegenerateIcon /> Regenerate
                      </button>
                    </div>
                  )}
                  {msg.loading && (
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about SOPs..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to logout?
            </p>
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