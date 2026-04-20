// ===================================
// SERVICIO DE CONTACTOS
// ===================================

import apiConfig from '../config/api';

class ContactService {

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || `Error ${res.status}`, data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getById(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts/${id}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Contacto no encontrado', data: null };
      return { success: true, data: data.data || data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async getByClient(clientId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts/client/${clientId}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async create(contactData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts`, {
        method:  'POST',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(this._buildPayload(contactData)),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al crear contacto', data: null };
      return { success: true, message: data.message || 'Contacto creado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async update(id, contactData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts/${id}`, {
        method:  'PUT',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify({ idContact: id, ...this._buildPayload(contactData) }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al actualizar contacto', data: null };
      return { success: true, message: data.message || 'Contacto actualizado', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Contacts/${id}`, {
        method:  'DELETE',
        headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al eliminar contacto' };
      return { success: true, message: data.message || 'Contacto eliminado' };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }

  _buildPayload(d) {
    return {
      idClient:         d.idClient         ? parseInt(d.idClient, 10)         : null,
      idCity:           d.idCity           ? parseInt(d.idCity, 10)           : null,
      idTitles:         d.idTitles         ? parseInt(d.idTitles, 10)         : null,
      idEmployee:       d.idEmployee       ? parseInt(d.idEmployee, 10)       : null,
      wordAreas:        d.wordAreas        || null,
      firstName:        d.firstName        || '',
      lastName:         d.lastName         || null,
      email:            d.email            || null,
      phone:            d.phone            || null,
      dateOfBirth:      d.dateOfBirth      || null,
      address:          d.address          || null,
      description:      d.description      || null,
      preferredChannel: d.preferredChannel ? parseInt(d.preferredChannel, 10) : null,
    };
  }

  // ── CATALOGS ─────────────────────────────────────────────────────────────

  async getTitles() {
    return this._getCatalog('catalogs/titles');
  }

  async getEmployees() {
    return this._getCatalog('catalogs/employees');
  }

  async getPreferredChannels() {
    return this._getCatalog('catalogs/preferred-channels');
  }

  async getClients() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Clients`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getStates() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Clients/states`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getCitiesByState(stateId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Clients/cities/${stateId}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async _getCatalog(path) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/${path}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }
}

export default new ContactService();
