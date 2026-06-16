import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Yes', cancelText = 'No, go back' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>

        <div className="flex space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;