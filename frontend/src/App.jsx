import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';  // <-- import DocumentsPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPPage />} />
      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/upload" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UploadPage />
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute allowedRoles={['employee', 'admin']}>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute allowedRoles={['employee', 'admin']}>
          <ChatPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;