// ===================================
// SERVICIO DE CATÁLOGOS
// ===================================

import apiConfig from '../config/api';

const _get = async (path) => {
  try {
    const res  = await fetch(`${apiConfig.baseURL}/${path}`, { headers: apiConfig.getHeaders(true) });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
    return { success: true, data: data.data || [] };
  } catch {
    return { success: false, message: 'Error de conexión', data: [] };
  }
};

const catalogService = {
  getTitles:          () => _get('catalogs/titles'),
  getBanks:           () => _get('catalogs/banks'),
  getEmployees:       () => _get('catalogs/employees'),
  getPaymentTerms:    () => _get('catalogs/payment-terms'),
  getPreferredChannels: () => _get('catalogs/preferred-channels'),
};

export default catalogService;
