import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Trash2, Edit3, Check, X } from 'lucide-react';

const CategoriesModal = ({ isOpen, onClose, categories = [], onRefresh, apiClient }) => {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setItems(categories);
      setNewName('');
      setEditingId(null);
      setEditingName('');
    }
  }, [isOpen, categories]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await apiClient.createCategory(name);
    setNewName('');
    await onRefresh?.();
  };

  const handleDelete = async (id) => {
    await apiClient.deleteCategory(id);
    await onRefresh?.();
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const confirmEdit = async () => {
    if (!editingId) return;
    await apiClient.updateCategory(editingId, editingName.trim());
    cancelEdit();
    await onRefresh?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="New Category"
            name="newCategory"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
          />
          <div className="pt-6">
            <Button onClick={handleCreate}>Add</Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No categories yet</div>
          )}
          {items.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2">
              {editingId === cat.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{cat.name}</div>
              )}
              <div className="flex items-center gap-2">
                {editingId === cat.id ? (
                  <>
                    <button className="p-1 text-green-600" title="Save" onClick={confirmEdit}><Check size={16} /></button>
                    <button className="p-1 text-gray-400" title="Cancel" onClick={cancelEdit}><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button className="p-1 text-gray-400 hover:text-blue-600" title="Rename" onClick={() => startEdit(cat)}><Edit3 size={16} /></button>
                    <button className="p-1 text-gray-400 hover:text-red-600" title="Delete" onClick={() => handleDelete(cat.id)}><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CategoriesModal;
