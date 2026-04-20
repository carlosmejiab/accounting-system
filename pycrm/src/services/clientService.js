// ===================================
// SERVICIO DE CLIENTES - ACTUALIZADO
// ===================================

import apiConfig from '../config/api';

class ClientService {

  // ===================================
  // GET ALL - clientes
  // ===================================
  async getAll() {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || `Error ${response.status}`, data: null };

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // GET BY ID
  // ===================================
  async getById(id) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/${id}`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Cliente no encontrado', data: null };

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // CREATE - ACTUALIZADO CON CAMPOS NUEVOS
  // ===================================
  async create(clientData) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients`, {
        method: 'POST',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          address: clientData.address,
          zipCode: clientData.zipCode || null,              // ← NUEVO
          comments: clientData.comments || null,
          idLocation: clientData.idLocation,
          idState: clientData.idState,
          idCity: clientData.idCity,
          idTypeClient: clientData.idTypeClient,
          idService: clientData.idService,
          paymentTerms: clientData.paymentTerms || null,    // ← NUEVO
          acceptSMS: clientData.acceptSMS || false,
          isActive: clientData.isActive !== undefined ? clientData.isActive : true,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al crear cliente', data: null };

      return { success: true, message: data.message || 'Cliente creado', data: data.data };
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // UPDATE - ACTUALIZADO CON CAMPOS NUEVOS
  // ===================================
  async update(id, clientData) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/${id}`, {
        method: 'PUT',
        headers: apiConfig.getHeaders(true),
        body: JSON.stringify({
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          address: clientData.address,
          zipCode: clientData.zipCode || null,              // ← NUEVO
          comments: clientData.comments || null,
          idLocation: clientData.idLocation,
          idState: clientData.idState,
          idCity: clientData.idCity,
          idTypeClient: clientData.idTypeClient,
          idService: clientData.idService,
          paymentTerms: clientData.paymentTerms || null,    // ← NUEVO
          acceptSMS: clientData.acceptSMS || false,
          isActive: clientData.isActive !== undefined ? clientData.isActive : true,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al actualizar cliente', data: null };

      return { success: true, message: data.message || 'Cliente actualizado', data: data.data };
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  // ===================================
  // DELETE
  // ===================================
  async delete(id) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/${id}`, {
        method: 'DELETE',
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al eliminar cliente' };

      return { success: true, message: data.message || 'Cliente eliminado' };
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }

  // ===================================
  // CATÁLOGOS - LOCATIONS
  // ===================================
  async getLocations() {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/locations`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener ubicaciones', data: [] };

      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error al obtener ubicaciones:', error);
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ===================================
  // CATÁLOGOS - STATES
  // ===================================
  async getStates() {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/states`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener estados', data: [] };

      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error al obtener estados:', error);
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ===================================
  // CATÁLOGOS - CITIES BY STATE
  // ===================================
  async getCitiesByState(stateId) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/cities/${stateId}`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener ciudades', data: [] };

      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error al obtener ciudades:', error);
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ===================================
  // CATÁLOGOS - TYPE CLIENTS
  // ===================================
  async getTypeClients() {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/types`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener tipos de cliente', data: [] };

      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error al obtener tipos de cliente:', error);
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ===================================
  // CATÁLOGOS - SERVICES BY TYPE
  // ===================================
  async getServicesByType(typeClientId) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/Clients/services/${typeClientId}`, {
        headers: apiConfig.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok)
        return { success: false, message: data.message || 'Error al obtener servicios', data: [] };

      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }
}

export default new ClientService();