export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

export const apiRequest = async (url, options = {}) => {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
  } finally {
    // Force complete page reload to clear any cached state
    window.location.replace('/login');
  }
};
