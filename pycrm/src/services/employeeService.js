// ===================================
// SERVICIO DE EMPLEADOS
// ===================================

import apiConfig from '../config/api';

class EmployeeService {

  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getById(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees/${id}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async create(payload) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees`, {
        method:  'POST',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al crear empleado', data: null };
      return { success: true, message: data.message || 'Empleado creado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async update(id, payload) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees/${id}`, {
        method:  'PUT',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al actualizar empleado', data: null };
      return { success: true, message: data.message || 'Empleado actualizado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees/${id}`, {
        method:  'DELETE',
        headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al eliminar empleado' };
      return { success: true, message: data.message || 'Empleado eliminado' };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async getCatalog(tipo) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Employees/catalogs/${tipo}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }
}

export default new EmployeeService();
