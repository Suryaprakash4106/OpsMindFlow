import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      <nav className="bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-2xl font-bold text-white">OpsMindFlow</span>
            <div className="space-x-4">
              <Link to="/login" className="text-white hover:text-gray-200 px-3 py-2">Login</Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100">Register</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Your AI-Powered SOP Assistant</h1>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            Instantly access company policies, procedures, and knowledge – powered by advanced AI.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg">
              Get Started
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10">
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}