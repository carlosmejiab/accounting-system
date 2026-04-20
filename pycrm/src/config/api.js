// ===================================
// CONFIGURACIÓN DE LA API
// ===================================

// ⚠️ IMPORTANTE: El puerto es 7002 según tu Swagger
const API_BASE_URL = 'https://localhost:7002/api';

const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const sesion = localStorage.getItem('usuarioActivo');
    if (sesion) {
      const { token } = JSON.parse(sesion);
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/Auth/login',  // Con mayúscula según tu API
      logout: '/Auth/logout',
      validateToken: '/Auth/validate-token',
    },
  },
  getHeaders,
};

export default apiConfig;