import apiConfig from '../config/api';

class StorageConfigService {
  async get() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/StorageConfig`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data };
    } catch { return { success: false, message: 'Connection error', data: null }; }
  }

  async update(payload) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/StorageConfig`, {
        method: 'PUT', headers: apiConfig.getHeaders(true), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Saved' };
    } catch { return { success: false, message: 'Connection error' }; }
  }
}

export default new StorageConfigService();
