export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include',
    headers,
    ...options,
  };

  return fetch(url, config);
};

export const logout = async () => {
  try {
    await apiRequest(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  localStorage.removeItem('accessToken');
};
