import React from 'react';
import { Plus, Key, Shield, Download, Upload, FolderPlus } from 'lucide-react';
import Button from '../ui/Button';

const ActionButtons = ({
  onAddPassword,
  onGeneratePassword,
  onHaveIBeenPwned,
  onImportCSV,
  onExportCSV,
  onManageCategories
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Button onClick={onAddPassword} className="flex items-center space-x-2">
        <Plus size={16} />
        <span>Add Password</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onGeneratePassword}
        className="flex items-center space-x-2"
      >
        <Key size={16} />
        <span>Generate Password</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onHaveIBeenPwned}
        className="flex items-center space-x-2"
      >
        <Shield size={16} />
        <span>Have I Been Pwned?</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onImportCSV}
        className="flex items-center space-x-2"
      >
        <Upload size={16} />
        <span>Import as CSV</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onExportCSV}
        className="flex items-center space-x-2"
      >
        <Download size={16} />
        <span>Export as CSV</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onManageCategories}
        className="flex items-center space-x-2"
      >
        <FolderPlus size={16} />
        <span>Manage Categories</span>
      </Button>
    </div>
  );
};

export default ActionButtons;