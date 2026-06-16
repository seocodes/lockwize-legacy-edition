import React, { useState, useEffect } from 'react';
import { Shield, Globe, User, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const PasswordForm = ({ isOpen, onClose, onSave, editingPassword = null, generatedPassword = '', categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    username: '',
    password: '',
    confirmPassword: '',
    categoryId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingPassword) {
      setFormData({
        name: editingPassword.name || '',
        website: editingPassword.website || '',
        username: editingPassword.username || '',
        password: editingPassword.password || '',
        confirmPassword: editingPassword.password || '',
        categoryId: editingPassword.categoryId || ''
      });
    } else {
      setFormData({
        name: '',
        website: '',
        username: '',
        password: generatedPassword || '',
        confirmPassword: generatedPassword || '',
        categoryId: ''
      });
    }
    setErrors({});
  }, [editingPassword, isOpen, generatedPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username) {
      newErrors.username = 'Username/Email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Optional URL validation - accept simple domains
    if (formData.website && formData.website.trim() !== '') {
      // Remove protocol if present
      const cleanUrl = formData.website.replace(/^https?:\/\//, '');
      // Basic domain validation
      const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainPattern.test(cleanUrl) && cleanUrl.trim() !== '') {
        newErrors.website = 'Please enter a valid domain (e.g. github.com)';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const passwordData = {
      id: editingPassword?.id,
      name: formData.name,
      website: formData.website,
      username: formData.username,
      password: formData.password,
      categoryId: formData.categoryId || null,
      lastUpdated: new Date().toISOString()
    };

    onSave(passwordData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add/Update Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name (e.g. Netflix, Gmail)"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter service name"
          error={errors.name}
          icon={<Shield className="w-4 h-4" />}
        />

        <Input
          label="Website (e.g. github.com) - Optional"
          name="website"
          type="text"
          value={formData.website}
          onChange={handleChange}
          placeholder="Enter website domain (e.g. github.com)"
          error={errors.website}
          icon={<Globe className="w-4 h-4" />}
        />

        <Input
          label="Username/Email Registered"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter username or email"
          error={errors.username}
          icon={<User className="w-4 h-4" />}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password"
          error={errors.password}
          icon={<Lock className="w-4 h-4" />}
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
          error={errors.confirmPassword}
          icon={<Lock className="w-4 h-4" />}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="submit" className="flex-1">
            Save
          </Button>
          <Button type="button" variant="danger" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordForm;