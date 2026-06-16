import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './components/LandingPage';
import Header from './components/layout/Header';
import ActionButtons from './components/layout/ActionButtons';
import FilterSidebar from './components/password/FilterSidebar';
import PasswordTable from './components/password/PasswordTable';
import PasswordForm from './components/password/PasswordForm';
import GeneratePasswordModal from './components/password/GeneratePasswordModal';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import ConfirmationModal from './components/ui/ConfirmationModal';
import HaveIBeenPwnedModal from './components/features/HaveIBeenPwnedModal';
import SettingsModal from './components/features/SettingsModal';
import CategoriesModal from './components/features/CategoriesModal';
import ImportCsvModal from './components/features/ImportCsvModal';
import ExportCsvModal from './components/features/ExportCsvModal';
import { api } from './utils/api';

// Helper to map backend password response to UI model
const mapPasswordFromApi = (p) => ({
  id: p.id,
  name: p.name,
  website: p.website,
  username: p.username,
  password: p.passwordEncrypted,
  categoryId: p.categoryId || null,
  lastUpdated: p.lastUpdated || p.createdAt
});

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  // Modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showHaveIBeenPwned, setShowHaveIBeenPwned] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showExportCSV, setShowExportCSV] = useState(false);

  // Data states
  const [passwords, setPasswords] = useState([]);
  const [editingPassword, setEditingPassword] = useState(null);
  const [passwordToDelete, setPasswordToDelete] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [categories, setCategories] = useState([]);

  // Check for email verification token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');

    if (verificationToken) {
      // Processar verificação de email
      api.verifyEmail(verificationToken)
        .then(async (response) => {
          alert(response.message || 'Email verificado com sucesso!');

          // Limpar parâmetros da URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Sempre tentar atualizar dados do usuário se estiver autenticado
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const userData = await api.getCurrentUser();
              setCurrentUser(userData);
              localStorage.setItem('currentUser', JSON.stringify(userData));
            } catch (err) {
              // Se falhar ao buscar, tentar recarregar a página para forçar atualização
              console.error('Erro ao atualizar dados do usuário após verificação:', err);
              // Não fazemos nada, o usuário pode recarregar manualmente
            }
          }
        })
        .catch((error) => {
          const errorMessage = error.message === 'unauthorized'
            ? 'Erro de autorização. Por favor, tente novamente ou entre em contato com o suporte.'
            : error.message || 'Erro ao verificar email. Token inválido ou expirado.';
          alert(errorMessage);
          // Limpar parâmetros da URL mesmo em caso de erro
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // Check if user is already authenticated and load initial data
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      // Tentar carregar dados atualizados do usuário
      api.getCurrentUser()
        .then(userData => {
          setCurrentUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setIsAuthenticated(true);
          setShowLanding(false);
          return Promise.all([loadPasswords(), loadCategories()]);
        })
        .catch(() => {
          // Se falhar, usar dados salvos
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
          setShowLanding(false);
          Promise.all([loadPasswords(), loadCategories()]).catch(() => {
            setIsAuthenticated(false);
            setShowLanding(true);
          });
        });
    }
  }, []);

  const loadPasswords = async () => {
    try {
      const list = await api.listPasswords();
      setPasswords(list.map(mapPasswordFromApi));
    } catch (e) {
      if (e.message === 'unauthorized') {
        setIsAuthenticated(false);
        setShowLogin(true);
      }
    }
  };

  const loadCategories = async () => {
    try {
      const list = await api.listCategories();
      setCategories(list);
    } catch {}
  };

  // Authentication handlers
  const handleLogin = async (credentials) => {
    try {
      const res = await api.login(credentials.email, credentials.password); // { token }
      localStorage.setItem('token', res.token);

      // Buscar dados completos do usuário do banco
      const userData = await api.getCurrentUser();
      setCurrentUser(userData);
      setIsAuthenticated(true);
      setShowLanding(false);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setShowLogin(false);
      await loadPasswords();
      await loadCategories();
    } catch (e) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }
  };

  const handleRegister = async (userData) => {
    try {
      const res = await api.register(userData.name, userData.email, userData.password); // { token }
      localStorage.setItem('token', res.token);

      // Buscar dados completos do usuário do banco
      const userDataFromApi = await api.getCurrentUser();
      setCurrentUser(userDataFromApi);
      setIsAuthenticated(true);
      setShowLanding(false);
      localStorage.setItem('currentUser', JSON.stringify(userDataFromApi));
      setShowRegister(false);
      await loadPasswords();
      await loadCategories();
    } catch (e) {
      throw new Error('Registration failed. Email may already be in use.');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowLanding(true);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setShowSettings(false);
  };

  // Password management handlers
  const handleAddPassword = () => {
    setEditingPassword(null);
    setShowPasswordForm(true);
  };

  const handleEditPassword = (password) => {
    setEditingPassword(password);
    setShowPasswordForm(true);
  };

  const handleSavePassword = async (passwordData) => {
    const payload = {
      name: passwordData.name,
      website: passwordData.website,
      username: passwordData.username,
      passwordEncrypted: passwordData.password,
      categoryId: passwordData.categoryId || null,
    };
    try {
      if (passwordData.id) {
        await api.updatePassword(passwordData.id, payload);
      } else {
        await api.createPassword(payload);
      }
      await loadPasswords();
      setShowPasswordForm(false);
    } catch (e) {
      alert('Failed to save password');
    }
  };

  const handleDeletePassword = (password) => {
    setPasswordToDelete(password);
    setShowConfirmation(true);
  };

  const confirmDeletePassword = async () => {
    try {
      if (passwordToDelete) {
        await api.deletePassword(passwordToDelete.id);
        await loadPasswords();
        setPasswordToDelete(null);
      }
    } catch (e) {
      alert('Failed to delete password');
    }
    setShowConfirmation(false);
  };

  const handleGeneratePassword = () => {
    setShowGeneratePassword(true);
  };

  const handleSaveGeneratedPassword = async (data) => {
    // Save directly when coming from generator
    try {
      await handleSavePassword(data);
      setGeneratedPassword('');
    } finally {
      setShowGeneratePassword(false);
    }
  };

  // Feature handlers
  const handleHaveIBeenPwned = () => {
    setShowHaveIBeenPwned(true);
  };

  const handleImportCSV = () => {
    setShowImportCSV(true);
  };

  const handleExportCSV = () => {
    setShowExportCSV(true);
  };

  const handleCsvImportSuccess = () => {
    // Recarregar dados após import bem-sucedido
    loadPasswords();
    loadCategories();
  };

  const handleCsvExportSuccess = () => {
    // Export não precisa recarregar dados
  };

  // Helper function to calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  // Filter passwords based on selected filter
  const filteredPasswords = passwords.filter(password => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter.startsWith('cat:')) {
      const catId = selectedFilter.slice(4);
      return (password.categoryId || '') === catId;
    }
    if (selectedFilter === 'weak') {
      const strength = calculatePasswordStrength(password.password);
      return strength < 60;
    }
    if (selectedFilter === 'old') {
      const lastUpdated = new Date(password.lastUpdated);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return lastUpdated < sixMonthsAgo;
    }
    // For other filters, you would check against categories/tags
    return true;
  });

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {showLanding ? (
            <LandingPage
              onShowLogin={() => {
                setShowLanding(false);
                setShowLogin(true);
              }}
              onShowRegister={() => {
                setShowLanding(false);
                setShowRegister(true);
              }}
            />
          ) : (
            <>
              <LoginForm
                isOpen={showLogin}
                onClose={() => {
                  setShowLogin(false);
                  setShowLanding(true);
                }}
                onLogin={handleLogin}
                onShowRegister={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
                onShowForgotPassword={() => {
                  setShowLogin(false);
                  setShowForgotPassword(true);
                }}
              />

              <RegisterForm
                isOpen={showRegister}
                onClose={() => {
                  setShowRegister(false);
                  setShowLanding(true);
                }}
                onRegister={handleRegister}
                onShowLogin={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />

              <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => {
                  setShowForgotPassword(false);
                  setShowLogin(true);
                }}
                email={currentUser?.email}
              />
            </>
          )}
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          userName={currentUser?.name || 'usuário'}
          onSettingsClick={() => setShowSettings(true)}
        />

        <div className="container mx-auto px-6 py-6">
          <ActionButtons
            onAddPassword={handleAddPassword}
            onGeneratePassword={handleGeneratePassword}
            onHaveIBeenPwned={handleHaveIBeenPwned}
            onImportCSV={handleImportCSV}
            onExportCSV={handleExportCSV}
            onManageCategories={() => setShowCategories(true)}
          />

          <div className="flex gap-6">
            <FilterSidebar
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              categories={categories}
            />

            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <PasswordTable
                  passwords={filteredPasswords}
                  onEdit={handleEditPassword}
                  onDelete={handleDeletePassword}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <PasswordForm
          isOpen={showPasswordForm}
          onClose={() => setShowPasswordForm(false)}
          onSave={handleSavePassword}
          editingPassword={editingPassword}
          generatedPassword={generatedPassword}
          categories={categories}
        />

        <GeneratePasswordModal
          isOpen={showGeneratePassword}
          onClose={() => setShowGeneratePassword(false)}
          onSavePassword={handleSaveGeneratedPassword}
          categories={categories}
        />

        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={confirmDeletePassword}
          title="Are you sure about that?"
          message={`Are you sure you want to delete the password for "${passwordToDelete?.name}"? This action cannot be undone.`}
        />

        <HaveIBeenPwnedModal
          isOpen={showHaveIBeenPwned}
          onClose={() => setShowHaveIBeenPwned(false)}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
        />

        <CategoriesModal
          isOpen={showCategories}
          onClose={() => setShowCategories(false)}
          categories={categories}
          onRefresh={loadCategories}
          apiClient={api}
        />

        <ImportCsvModal
          isOpen={showImportCSV}
          onClose={() => setShowImportCSV(false)}
          onSuccess={handleCsvImportSuccess}
        />

        <ExportCsvModal
          isOpen={showExportCSV}
          onClose={() => setShowExportCSV(false)}
          onSuccess={handleCsvExportSuccess}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;