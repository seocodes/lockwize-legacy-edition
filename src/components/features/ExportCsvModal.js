import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { api } from '../../utils/api';

const ExportCsvModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const categoriesData = await api.listCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Chamar API para exportar
      const response = await api.exportPasswords(selectedCategory || null);

      // Fazer download do arquivo real
      const csvBlob = await api.downloadCsvFile(response.downloadUrl);

      // Criar link de download
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`Export concluído! Arquivo: ${response.filename}`);
      setMessageType('success');

      if (onSuccess) {
        onSuccess();
      }

      // Fechar modal após 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao exportar:', error);
      setMessage(`Erro ao exportar: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setMessageType('');
    setSelectedCategory('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={(
        <span className="flex items-center">
          <Download className="mr-2" size={20} />
          Exportar Senhas como CSV
        </span>
      )}
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria (opcional)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Formato do CSV:</strong> name, website, username, password, category_name, notes, created_at, last_updated
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-md flex items-center ${
              messageType === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : messageType === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="mr-2" size={16} />
              ) : (
                <AlertCircle className="mr-2" size={16} />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Exportar CSV</span>
                </>
              )}
            </Button>
          </div>
      </div>
    </Modal>
  );
};

export default ExportCsvModal;