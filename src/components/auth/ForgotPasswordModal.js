import React from 'react';
import { Mail } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const ForgotPasswordModal = ({ isOpen, onClose, email = 'user@email.com' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Reset">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          An reset password e-mail has been sent to you ({email})
        </p>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;