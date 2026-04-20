// ===================================
// SERVICIO DE USUARIOS
// ===================================

import apiConfig from '../config/api';

// Fallback si la API falla — coincide con dbo.Profiles
const ROLES_FALLBACK = [
  { value: 1, label: 'Super Administrador' },
  { value: 2, label: 'Administrador' },
  { value: 3, label: 'Operador' },
  { value: 4, label: 'Consulta' },
];

class UserService {

  // ===================================
  // GET ALL — usuarios paginados
  // ===================================
  async getAll(page = 1, pageSize = 10, search = '', orderBy = 'CreatedAt', orderDirection = 'DESC') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        orderBy,
        orderDirection,
      });
      if (search) params.append('search', search);

      const response = await fetch(`${apiConfig.baseURL}/Users?${params}`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || `Error ${response.status}`, data: null };

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // GET BY ID
  // ===================================
  async getById(id) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Users/${id}`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Usuario no encontrado', data: null };

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // GET ROLES — desde dbo.Profiles via SP
  //
  // El backend llama a spUsers_GetRoles que devuelve:
  // [{ value: 1, label: "Super Administrador" }, ...]
  //
  // El frontend muestra el label en el select y
  // envía el value (ProfileId) al crear/editar usuario.
  // ===================================
  async getRoles() {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Users/roles`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener roles', data: ROLES_FALLBACK };

      const roles = data.data || [];

      // Si la API devuelve lista vacía, usar fallback
      if (roles.length === 0)
        return { success: true, data: ROLES_FALLBACK };

      return { success: true, data: roles };
    } catch (error) {
      console.error('Error al obtener roles:', error);
      // En caso de error de red, devolver fallback para no bloquear el formulario
      return { success: false, message: 'Error de conexión', data: ROLES_FALLBACK };
    }
  }

  // ===================================
  // CREATE — incluye profileId
  //
  // El backend:
  //   1. Determina Rol técnico (Admin/User) según el nombre del perfil
  //   2. Crea en dbo.Users
  //   3. Inserta en dbo.UserProfiles
  // ===================================
  async create(userData) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Users`, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({
          username:  userData.username,
          password:  userData.password,
          nombre:    userData.nombre,
          email:     userData.email,
          avatar:    userData.avatar || '',
          profileId: userData.profileId,   // int — ID del perfil seleccionado
        }),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al crear usuario', data: null };

      return { success: true, message: data.message || 'Usuario creado', data: data.data };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // UPDATE — puede cambiar el perfil
  // ===================================
  async update(id, userData) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Users/${id}`, {
        method: 'PUT',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({
          nombre:    userData.nombre,
          email:     userData.email,
          avatar:    userData.avatar || '',
          profileId: userData.profileId,   // int — nuevo perfil (opcional)
        }),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al actualizar usuario', data: null };

      return { success: true, message: data.message || 'Usuario actualizado', data: data.data };
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // DELETE
  // ===================================
  async delete(id) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Users/${id}`, {
        method: 'DELETE',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al eliminar usuario' };

      return { success: true, message: data.message || 'Usuario eliminado' };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }
}

export default new UserService();