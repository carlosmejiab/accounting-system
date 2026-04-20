// ===================================
// SERVICIO DE AUTENTICACIÓN
// ===================================

import apiConfig from '../config/api';

class AuthService {
  /**
   * Login contra la API
   */
  async login(username, password) {
    try {
      const url = `${apiConfig.baseURL}${apiConfig.endpoints.auth.login}`;
      
      console.log('🔄 Intentando login en:', url);
      console.log('📤 Enviando:', { username, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(false),
        body: JSON.stringify({
          username,
          password,
        }),
      });

      console.log('📥 Status HTTP:', response.status);
      
      // Parsear respuesta JSON
      const data = await response.json();
      console.log('📥 Respuesta completa:', data);

      // Verificar errores HTTP
      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Error ${response.status}`,
          data: null,
        };
      }

      // Verificar campo success de tu API
      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Credenciales incorrectas',
          data: null,
        };
      }

      // ✅ Login exitoso
      // Tu API retorna: { success: true, message: null, user: {...}, token: "..." }
      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: data.user,           // Ya viene con la estructura correcta
          accessToken: data.token,   // Tu API lo llama "token", no "accessToken"
          refreshToken: null,        // Tu API no lo retorna
          expiresIn: 900            // Asumimos 15 minutos
        },
      };

    } catch (error) {
      console.error('❌ Error de red:', error);
      
      // Error de conexión
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: '⚠️ No se pudo conectar con el servidor. Verifica:\n1. Que la API esté corriendo (F5 en Visual Studio)\n2. Que el puerto sea 7002\n3. Que aceptes el certificado SSL en https://localhost:7002',
          data: null,
        };
      }
      
      return {
        success: false,
        message: 'Error inesperado: ' + error.message,
        data: null,
      };
    }
  }

  /**
   * Validar token
   */
  async validateToken() {
    try {
      const url = `${apiConfig.baseURL}${apiConfig.endpoints.auth.validateToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.getHeaders(true),
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();

      return { 
        valid: data.success === true, 
        user: data.user 
      };

    } catch (error) {
      console.error('❌ Error validando token:', error);
      return { valid: false };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const url = `${apiConfig.baseURL}${apiConfig.endpoints.auth.logout}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
      });

      if (!response.ok) {
        throw new Error('Error en logout');
      }

      const data = await response.json();

      return {
        success: data.success,
        message: data.message || 'Sesión cerrada',
      };

    } catch (error) {
      console.error('❌ Error en logout:', error);
      return {
        success: false,
        message: 'Error al cerrar sesión',
      };
    }
  }
}

export default new AuthService();