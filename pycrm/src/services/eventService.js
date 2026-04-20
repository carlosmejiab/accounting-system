// ===================================
// SERVICIO DE EVENTOS
// ===================================

import apiConfig from '../config/api';

class EventService {

  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getById(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/${id}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async create(eventData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events`, {
        method:  'POST',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al crear evento', data: null };
      return { success: true, message: data.message || 'Evento creado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async update(id, eventData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/${id}`, {
        method:  'PUT',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al actualizar evento', data: null };
      return { success: true, message: data.message || 'Evento actualizado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/${id}`, {
        method:  'DELETE',
        headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al eliminar evento' };
      return { success: true, message: data.message || 'Evento eliminado' };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async getParticipants(idEvent) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/${idEvent}/participants`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getCatalog(tipo) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/catalogs/${tipo}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getCalendar() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Events/calendar`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }
}

export default new EventService();
