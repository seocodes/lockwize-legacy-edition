const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    // Para rotas públicas, não remover token
    const isPublicRoute = path.includes('/verify-email') || path.includes('/auth/');
    if (!isPublicRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }

    // Tentar extrair mensagem de erro do backend
    let errorMessage = 'unauthorized';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || 'unauthorized';
      } else {
        const text = await response.text();
        errorMessage = text || 'unauthorized';
      }
    } catch {}
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let message = '';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        message = errorData.error || errorData.message || JSON.stringify(errorData);
      } else {
        message = await response.text();
      }
    } catch {}
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Função especial para upload de arquivos (FormData)
async function requestFormData(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    throw new Error('unauthorized');
  }

  if (!response.ok) {
    let message = '';
    try { message = await response.text(); } catch {}
    throw new Error(message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  refresh: () => request('/api/auth/refresh', { method: 'POST' }),

  listPasswords: () => request('/api/passwords', { method: 'GET' }),
  getPassword: (id) => request(`/api/passwords/${id}`, { method: 'GET' }),
  createPassword: (payload) => request('/api/passwords', { method: 'POST', body: JSON.stringify(payload) }),
  updatePassword: (id, payload) => request(`/api/passwords/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePassword: (id) => request(`/api/passwords/${id}`, { method: 'DELETE' }),

  listCategories: () => request('/api/categories', { method: 'GET' }),
  createCategory: (name) => request('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateCategory: (id, name) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  // CSV Export
  exportPasswords: async (categoryId) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);

    return request(`/api/passwords/export?${params.toString()}`, { method: 'POST' });
  },

  // Download do arquivo CSV exportado
  downloadCsvFile: async (downloadUrl) => {
    const token = getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${downloadUrl}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao baixar arquivo');
    }

    return response.blob();
  },

  // CSV Import
  importPasswords: (file, overwriteExisting = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwriteExisting', overwriteExisting);

    return requestFormData('/api/passwords/import', formData);
  },

  // User profile
  getCurrentUser: () => request('/api/users/me', { method: 'GET' }),
  updateProfile: (name) => request('/api/users/me', { method: 'PUT', body: JSON.stringify({ name }) }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
  changeEmail: (newEmail, password) =>
    request('/api/users/me/change-email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password })
    }),
  verifyEmail: (token) =>
    request(`/api/users/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'POST'
    }),
  deleteAccount: () => request('/api/users/me', { method: 'DELETE' }),
};
