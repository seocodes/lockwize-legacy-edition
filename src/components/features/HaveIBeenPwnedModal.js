import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const HaveIBeenPwnedModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Have I Been Pwned?">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Feature Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This feature will allow you to check if your email addresses have been compromised in data breaches.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Integration with the Have I Been Pwned API will be implemented in a future update.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default HaveIBeenPwnedModal;