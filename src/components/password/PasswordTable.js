import React, { useState } from 'react';
import { Eye, EyeOff, Edit, Trash2, Monitor, Copy, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

// Component to display favicon for websites
const FaviconIcon = ({ website, name }) => {
  const [imgError, setImgError] = useState(false);

  if (!website || imgError) {
    return (
      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
        <Monitor className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Clean website URL
  const cleanUrl = website.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden">
      <img
        src={`https://www.google.com/s2/favicons?domain=${cleanUrl}&sz=32`}
        alt={`${name} favicon`}
        className="w-8 h-8"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

const PasswordTable = ({ passwords, onEdit, onDelete, onToggleVisibility }) => {
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const togglePasswordVisibility = (passwordId) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(passwordId)) {
      newVisible.delete(passwordId);
    } else {
      newVisible.add(passwordId);
    }
    setVisiblePasswords(newVisible);
    onToggleVisibility?.(passwordId);
  };

  const copyPassword = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(password);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    if (strength >= 80) return { text: 'Strong', color: 'text-green-600 dark:text-green-400' };
    if (strength >= 60) return { text: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
    if (strength >= 40) return { text: 'Weak', color: 'text-orange-600 dark:text-orange-400' };
    return { text: 'Weak', color: 'text-red-600 dark:text-red-400' };
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInMonths / 12);

    if (diffInYears > 0) return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    if (diffInMonths > 0) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return 'Today';
  };

  const getTimeColor = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays > 180) return 'text-red-600 dark:text-red-400'; // 6 months
    if (diffInDays > 90) return 'text-orange-600 dark:text-orange-400'; // 3 months
    if (diffInDays > 30) return 'text-yellow-600 dark:text-yellow-400'; // 1 month
    return 'text-green-600 dark:text-green-400';
  };

  if (passwords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <Monitor className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">No passwords yet</p>
          <p className="text-sm">Add your first password to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Password</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Password Strength</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Last Time Updated</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {passwords.map((password) => {
            const strength = getPasswordStrength(password.password);
            const timeAgo = getTimeAgo(password.lastUpdated);
            const timeColor = getTimeColor(password.lastUpdated);

            return (
              <tr
                key={password.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <FaviconIcon website={password.website} name={password.name} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {password.name}
                      </div>
                      {password.website && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {password.website}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">
                      {visiblePasswords.has(password.id)
                        ? password.password
                        : '••••••••••••••••'
                      }
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(password.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={visiblePasswords.has(password.id) ? 'Hide password' : 'Show password'}
                    >
                      {visiblePasswords.has(password.id) ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => copyPassword(password.password)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Copy password"
                    >
                      {copiedId === password.password ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={cn('text-sm font-medium', strength.color)}>
                    {strength.text}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={cn('text-sm', timeColor)}>
                    {timeAgo}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(password)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit password"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(password)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete password"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PasswordTable;