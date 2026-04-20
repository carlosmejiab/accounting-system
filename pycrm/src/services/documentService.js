// ===================================
// SERVICIO DE DOCUMENTOS
// ===================================

import apiConfig from '../config/api';

class DocumentService {

  // ── LIST ─────────────────────────────────────────────────────────────────
  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  async getById(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/${id}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data };
    } catch { return { success: false, message: 'Connection error', data: null }; }
  }

  // ── FILTERED ─────────────────────────────────────────────────────────────
  async getByTask(idTask) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/by-task/${idTask}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  async getByClient(idClient) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/by-client/${idClient}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  // ── SUMMARIES ────────────────────────────────────────────────────────────
  async getTaskSummaries() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/summaries/tasks`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  async getClientSummaries() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/summaries/clients`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  // ── UPLOAD ───────────────────────────────────────────────────────────────
  uploadWithProgress(formData, onProgress) {
    return new Promise((resolve) => {
      const token = JSON.parse(localStorage.getItem('usuarioActivo') || '{}')?.token || '';
      const xhr   = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress)
          onProgress(Math.round((e.loaded / e.total) * 100));
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300)
            resolve({ success: true, message: data.message || 'Uploaded', data: data.data });
          else
            resolve({ success: false, message: data.message || `Error ${xhr.status}` });
        } catch { resolve({ success: false, message: 'Invalid server response' }); }
      });

      xhr.addEventListener('error', () => resolve({ success: false, message: 'Network error' }));
      xhr.addEventListener('abort', () => resolve({ success: false, message: 'Upload cancelled' }));

      xhr.open('POST', `${apiConfig.baseURL}/Documents`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────
  async update(id, docData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/${id}`, {
        method: 'PUT', headers: apiConfig.getHeaders(true), body: JSON.stringify(docData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error updating' };
      return { success: true, message: data.message || 'Updated' };
    } catch { return { success: false, message: 'Connection error' }; }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/${id}`, {
        method: 'DELETE', headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error deleting' };
      return { success: true, message: data.message || 'Deleted' };
    } catch { return { success: false, message: 'Connection error' }; }
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────
  async download(id, fileName) {
    try {
      const token = JSON.parse(localStorage.getItem('usuarioActivo') || '{}')?.token || '';
      const res   = await fetch(`${apiConfig.baseURL}/Documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { success: false, message: `File not found (${res.status})` };

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch { return { success: false, message: 'Download error' }; }
  }

  // ── FOLDERS ──────────────────────────────────────────────────────────────
  async getFolders() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/folders`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  async getFoldersByClient(idClient) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/folders/client/${idClient}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }

  async createFolder(folderData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/folders`, {
        method: 'POST', headers: apiConfig.getHeaders(true), body: JSON.stringify(folderData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error creating folder' };
      return { success: true, message: data.message || 'Folder created', data: data.data };
    } catch { return { success: false, message: 'Connection error' }; }
  }

  async ensureTaskFolder(idTask) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/folders/task/${idTask}`, {
        method: 'POST', headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch { return { success: false, message: 'Connection error' }; }
  }

  // ── FETCH BLOB (for in-panel preview) ────────────────────────────────────
  async fetchBlob(id) {
    try {
      const token = JSON.parse(localStorage.getItem('usuarioActivo') || '{}')?.token || '';
      const res   = await fetch(`${apiConfig.baseURL}/Documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { success: false };
      const blob = await res.blob();
      return { success: true, url: URL.createObjectURL(blob) };
    } catch { return { success: false }; }
  }

  // ── CATALOGS ─────────────────────────────────────────────────────────────
  async getCatalog(tipo) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Documents/catalogs/${tipo}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch { return { success: false, message: 'Connection error', data: [] }; }
  }
}

export default new DocumentService();
