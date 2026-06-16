import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Check, Shield, Globe, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const GeneratePasswordModal = ({ isOpen, onClose, onSavePassword, categories = [] }) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', website: '', username: '', categoryId: '' });

  const generatePassword = useCallback(() => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
    calculatePasswordStrength(password);
  }, []);

  const calculatePasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    setPasswordStrength(Math.min(strength, 100));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleSave = () => {
    onSavePassword({
      name: form.name,
      website: form.website,
      username: form.username,
      password: generatedPassword,
      categoryId: form.categoryId || null,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      // reset fields every time open
      setForm({ name: '', website: '', username: '', categoryId: '' });
      setCopied(false);
      generatePassword();
    }
  }, [isOpen, generatePassword]);

  const getStrengthColor = () => {
    if (passwordStrength >= 80) return 'text-green-600 dark:text-green-400';
    if (passwordStrength >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (passwordStrength >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStrengthText = () => {
    if (passwordStrength >= 80) return 'Very Strong';
    if (passwordStrength >= 60) return 'Strong';
    if (passwordStrength >= 40) return 'Medium';
    if (passwordStrength >= 20) return 'Weak';
    return 'Very Weak';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Password">
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-lg font-mono text-gray-900 dark:text-gray-100 break-all">
                {generatedPassword}
              </code>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Copy password"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <span className={`text-sm font-medium ${getStrengthColor()}`}>
              {passwordStrength}%
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({getStrengthText()})
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={generatePassword}
            variant="secondary"
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Generate New</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Name (e.g. Netflix, Gmail)"
            name="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter service name"
            icon={<Shield className="w-4 h-4" />}
          />
          <Input
            label="Website (e.g. netflix.com) - Optional"
            name="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="Enter website URL"
            icon={<Globe className="w-4 h-4" />}
          />
          <Input
            label="Username/Email Registered"
            name="username"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter username or email"
            icon={<User className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button onClick={onClose} variant="danger" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratePasswordModal;