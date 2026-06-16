import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { api } from '../../utils/api';

const ImportCsvModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setMessage('Por favor, selecione um arquivo CSV válido.');
        setMessageType('error');
        return;
      }

      // Validar tamanho (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage('Arquivo muito grande. Máximo 10MB.');
        setMessageType('error');
        return;
      }

      setFile(selectedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('Por favor, selecione um arquivo CSV.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setImportResult(null);

    try {
      const response = await api.importPasswords(file, overwriteExisting);
      setImportResult(response);

      if (response.errorCount === 0) {
        setMessage(`Import concluído com sucesso! ${response.successCount} senhas importadas.`);
        setMessageType('success');

        if (onSuccess) {
          onSuccess();
        }

        // Fechar modal após 3 segundos
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setMessage(`Import concluído com ${response.errorCount} erros. ${response.successCount} senhas importadas com sucesso.`);
        setMessageType('warning');
      }

    } catch (error) {
      console.error('Erro ao importar:', error);
      setMessage(`Erro ao importar: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setOverwriteExisting(false);
    setMessage('');
    setMessageType('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = {
        target: {
          files: [droppedFile]
        }
      };
      handleFileSelect(event);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={(
        <span className="flex items-center">
          <Upload className="mr-2" size={20} />
          Importar Senhas do CSV
        </span>
      )}
    >
      <div className="space-y-4">
          {/* Área de upload */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              file
                ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <FileText size={24} />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                <Upload size={48} className="mx-auto mb-2" />
                <p className="text-lg font-medium mb-1">Arraste um arquivo CSV aqui</p>
                <p className="text-sm">ou</p>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Selecionar arquivo
                </Button>
              </div>
            )}
          </div>

          {/* Opções */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overwriteExisting"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="overwriteExisting" className="text-sm text-gray-700 dark:text-gray-300">
              Sobrescrever senhas existentes (mesmo nome + username)
            </label>
          </div>

          {/* Informações sobre formato */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Formato esperado do CSV:</strong>
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
              name,website,username,password,category_name,notes,created_at,last_updated
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Campos obrigatórios: name, username, password
            </p>
          </div>

          {/* Resultado do import */}
          {importResult && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resultado do Import:</h4>
              <div className="space-y-1 text-sm">
                <p>Total processado: {importResult.totalProcessed}</p>
                <p className="text-green-600 dark:text-green-400">Sucessos: {importResult.successCount}</p>
                <p className="text-red-600 dark:text-red-400">Erros: {importResult.errorCount}</p>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-600 dark:text-red-400 mb-1">Erros encontrados:</p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>• ... e mais {importResult.errors.length - 5} erros</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Mensagens */}
          {message && (
            <div className={`p-3 rounded-md flex items-center ${
              messageType === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : messageType === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
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
              onClick={handleImport}
              disabled={isLoading || !file}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Importar CSV</span>
                </>
              )}
            </Button>
          </div>
      </div>
    </Modal>
  );
};

export default ImportCsvModal;
