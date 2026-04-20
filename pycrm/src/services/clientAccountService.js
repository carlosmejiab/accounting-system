// ===================================
// SERVICIO DE CUENTAS DE CLIENTE
// ===================================

import apiConfig from '../config/api';

class ClientAccountService {

  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getBanks() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts/banks`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getByClient(clientId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts/client/${clientId}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async create(accountData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts`, {
        method:  'POST',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify({
          idClient:      parseInt(accountData.idClient, 10),
          idBank:        parseInt(accountData.idBank, 10),
          accountNumber: accountData.accountNumber,
          isActive:      accountData.isActive !== false,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al crear cuenta', data: null };
      return { success: true, message: data.message || 'Cuenta creada', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async update(id, accountData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts/${id}`, {
        method:  'PUT',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify({
          idClientAccount: id,
          idClient:        parseInt(accountData.idClient, 10),
          idBank:          parseInt(accountData.idBank, 10),
          accountNumber:   accountData.accountNumber,
          isActive:        accountData.isActive !== false,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al actualizar cuenta', data: null };
      return { success: true, message: data.message || 'Cuenta actualizada', data: data.data };
    } catch {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/ClientAccounts/${id}`, {
        method:  'DELETE',
        headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al eliminar cuenta' };
      return { success: true, message: data.message || 'Cuenta eliminada' };
    } catch {
      return { success: false, message: 'Error de conexión' };
    }
  }
}

export default new ClientAccountService();
