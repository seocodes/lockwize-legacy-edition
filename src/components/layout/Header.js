import React from 'react';
import { User, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';

const Header = ({ userName = 'augusto', onSettingsClick }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - User info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            howdy, {userName}
          </span>
        </div>

        {/* Center - App title */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Lockwize
          </h1>
        </div>

        {/* Right side - Theme toggle and settings */}
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onSettingsClick}
            className="p-2"
            title="Settings"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;