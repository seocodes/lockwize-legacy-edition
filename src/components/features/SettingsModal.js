import React, { useState, useEffect } from 'react';
import { LogOut, User, Trash2, Edit2, Mail, Lock, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { api } from '../../utils/api';

const SettingsModal = ({ isOpen, onClose, onSignOut, currentUser, onUpdateUser }) => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ name: currentUser?.name || '' });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailFormData, setEmailFormData] = useState({
    newEmail: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Atualizar formData quando currentUser mudar (especialmente após verificação de email)
  useEffect(() => {
    if (currentUser && showProfileSettings) {
      setFormData({ name: currentUser.name || '' });
    }
  }, [currentUser, showProfileSettings]);

  const handleProfileClick = () => {
    setShowProfileSettings(true);
    setFormData({ name: currentUser?.name || '' });
    setError('');

    // Forçar atualização dos dados do usuário quando abrir o modal
    if (localStorage.getItem('token')) {
      api.getCurrentUser()
        .then(userData => {
          onUpdateUser(userData);
        })
        .catch(() => {
          // Se falhar, manter dados atuais
        });
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call real API to update user profile in database
      const response = await api.updateProfile(formData.name);

      // Update local storage with response from backend
      if (response) {
        localStorage.setItem('currentUser', JSON.stringify(response));
        onUpdateUser(response);
      }

      setShowProfileSettings(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');

    try {
      // Call real API to delete account and all related data
      await api.deleteAccount();

      // Clear local storage and sign out
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      onSignOut();
      onClose();
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowProfileSettings(false);
    setShowChangePassword(false);
    setShowChangeEmail(false);
    setShowDeleteConfirm(false);
    setError('');
    setSuccess('');
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setEmailFormData({ newEmail: '', password: '' });
    onClose();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await api.changePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to change password. Please check your current password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!emailFormData.newEmail.match(/^[A-Za-z0-9+_.-]+@(.+)$/)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await api.changeEmail(emailFormData.newEmail, emailFormData.password);
      setSuccess('Verification email sent! Please check your new email inbox and click the verification link.');
      setEmailFormData({ newEmail: '', password: '' });
      setTimeout(() => {
        setShowChangeEmail(false);
        setSuccess('');
      }, 3000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to request email change. Please check your password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Delete Account">
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              ⚠️ This action cannot be undone. All your data will be permanently deleted in compliance with LGPD (Brazilian General Data Protection Law).
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Are you sure you want to delete your account? This will:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Permanently delete all your saved passwords</li>
              <li>Delete all your categories</li>
              <li>Remove all your account data</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex space-x-3">
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (showChangePassword) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordFormData.currentPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
              placeholder="Enter your current password"
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
              placeholder="Enter your new password (min 6 characters)"
              error={passwordFormData.newPassword.length > 0 && passwordFormData.newPassword.length < 6 ? 'Password must be at least 6 characters' : ''}
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
              placeholder="Confirm your new password"
              error={passwordFormData.confirmPassword.length > 0 && passwordFormData.newPassword !== passwordFormData.confirmPassword ? 'Passwords do not match' : ''}
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </p>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || passwordFormData.currentPassword.length === 0 ||
                       passwordFormData.newPassword.length < 6 ||
                       passwordFormData.newPassword !== passwordFormData.confirmPassword}
              className="flex-1"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowChangePassword(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (showChangeEmail) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Change Email">
        <form onSubmit={handleChangeEmail} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <Input
              label="New Email"
              name="newEmail"
              type="email"
              value={emailFormData.newEmail}
              onChange={(e) => setEmailFormData({ ...emailFormData, newEmail: e.target.value })}
              placeholder="Enter your new email"
              error={emailFormData.newEmail.length > 0 && !emailFormData.newEmail.match(/^[A-Za-z0-9+_.-]+@(.+)$/) ? 'Please enter a valid email address' : ''}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Confirm Password"
              name="password"
              type="password"
              value={emailFormData.password}
              onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
              placeholder="Enter your password to confirm"
              icon={<Lock className="w-4 h-4" />}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You need to enter your password to change your email
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-300 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || emailFormData.newEmail.length === 0 ||
                       !emailFormData.newEmail.match(/^[A-Za-z0-9+_.-]+@(.+)$/) ||
                       emailFormData.password.length === 0}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowChangeEmail(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (showProfileSettings) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Profile Settings">
        <form onSubmit={handleNameUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              To change your email, use the "Change Email" option from the settings menu
            </p>
          </div>

          <div>
            <Input
              label="Display Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter your name"
              error={formData.name.trim().length < 2 ? 'Name must be at least 2 characters' : ''}
              icon={<User className="w-4 h-4" />}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This name appears in your greeting: "howdy, {formData.name}"
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || formData.name.trim().length < 2}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProfileSettings(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Delete Account</span>
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Settings">
      <div className="space-y-4">
        <div
          onClick={handleProfileClick}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Profile Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your name and account information</p>
          </div>
          <Edit2 className="w-5 h-5 text-gray-400" />
        </div>

        <div
          onClick={() => setShowChangeEmail(true)}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Change Email</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your email address</p>
          </div>
          <Edit2 className="w-5 h-5 text-gray-400" />
        </div>

        <div
          onClick={() => setShowChangePassword(true)}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
          </div>
          <Edit2 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            variant="danger"
            onClick={onSignOut}
            className="w-full flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
