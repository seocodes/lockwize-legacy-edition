import React from 'react';
import { Shield } from 'lucide-react';

const LandingPage = ({ onShowLogin, onShowRegister }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            LockWize
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Secure your passwords with confidence
          </p>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={onShowLogin}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              Login
            </button>

            <button
              onClick={onShowRegister}
              className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-lg font-semibold"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
