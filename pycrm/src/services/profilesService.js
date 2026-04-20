// ===================================
// SERVICIO DE PERFILES Y PERMISOS
// ===================================

import apiConfig from '../config/api';

class ProfilesService {
  /**
   * Obtener todos los perfiles
   */
  async getAll() {
    try {
      const url = `${apiConfig.baseURL}/Profiles`;
      
      console.log('🔄 Obteniendo perfiles:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();
      console.log('📥 Respuesta perfiles:', data);

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Error ${response.status}`,
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Error al obtener perfiles:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
        data: null,
      };
    }
  }

  /**
   * Obtener perfil por ID con detalles
   */
  async getById(id) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/${id}`;
      
      console.log('🔄 Obteniendo perfil:', id);

      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Perfil no encontrado',
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      return {
        success: false,
        message: 'Error de conexión',
        data: null,
      };
    }
  }

  /**
   * Crear nuevo perfil
   */
  async create(profileData) {
    try {
      const url = `${apiConfig.baseURL}/Profiles`;
      
      console.log('🔄 Creando perfil:', profileData.name);

      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al crear perfil',
          data: null,
        };
      }

      console.log('✅ Perfil creado:', data.data);

      return {
        success: true,
        message: data.message || 'Perfil creado exitosamente',
        data: data.data,
      };
    } catch (error) {
      console.error('❌ Error al crear perfil:', error);
      return {
        success: false,
        message: 'Error de conexión',
        data: null,
      };
    }
  }

  /**
   * Actualizar perfil existente
   */
  async update(id, profileData) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/${id}`;
      
      console.log('🔄 Actualizando perfil:', id);

      const response = await fetch(url, {
        method: 'PUT',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al actualizar perfil',
          data: null,
        };
      }

      console.log('✅ Perfil actualizado:', data.data);

      return {
        success: true,
        message: data.message || 'Perfil actualizado exitosamente',
        data: data.data,
      };
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      return {
        success: false,
        message: 'Error de conexión',
        data: null,
      };
    }
  }

  /**
   * Eliminar perfil
   */
  async delete(id) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/${id}`;
      
      console.log('🔄 Eliminando perfil:', id);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al eliminar perfil',
        };
      }

      console.log('✅ Perfil eliminado');

      return {
        success: true,
        message: data.message || 'Perfil eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error al eliminar perfil:', error);
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  }

  /**
   * Asignar permisos a un perfil
   */
  async assignPermissions(profileId, permissions) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/${profileId}/permissions`;
      
      console.log('🔄 Asignando permisos al perfil:', profileId);

      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al asignar permisos',
        };
      }

      console.log('✅ Permisos asignados');

      return {
        success: true,
        message: data.message || 'Permisos asignados exitosamente',
      };
    } catch (error) {
      console.error('❌ Error al asignar permisos:', error);
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  }

  /**
   * Obtener matriz de permisos
   */
  async getPermissionsMatrix(profileId = null) {
    try {
      const params = profileId ? `?profileId=${profileId}` : '';
      const url = `${apiConfig.baseURL}/Profiles/permissions-matrix${params}`;
      
      console.log('🔄 Obteniendo matriz de permisos');

      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al obtener matriz',
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Error al obtener matriz:', error);
      return {
        success: false,
        message: 'Error de conexión',
        data: null,
      };
    }
  }

  /**
   * Asignar perfiles a un usuario
   */
  async assignProfilesToUser(userId, profileIds) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/users/${userId}/profiles`;
      
      console.log('🔄 Asignando perfiles al usuario:', userId);

      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ profileIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al asignar perfiles',
        };
      }

      console.log('✅ Perfiles asignados al usuario');

      return {
        success: true,
        message: data.message || 'Perfiles asignados exitosamente',
      };
    } catch (error) {
      console.error('❌ Error al asignar perfiles:', error);
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  }

  /**
   * Obtener permisos efectivos de un usuario
   */
  async getUserPermissions(userId) {
    try {
      const url = `${apiConfig.baseURL}/Profiles/users/${userId}/permissions`;
      
      console.log('🔄 Obteniendo permisos del usuario:', userId);

      const response = await fetch(url, {
        method: 'GET',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al obtener permisos',
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      return {
        success: false,
        message: 'Error de conexión',
        data: null,
      };
    }
  }
}

export default new ProfilesService();