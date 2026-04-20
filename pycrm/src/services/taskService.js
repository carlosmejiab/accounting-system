// ===================================
// SERVICIO DE TAREAS
// ===================================

import apiConfig from '../config/api';

class TaskService {

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async getAll() {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || `Error ${res.status}`, data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async getById(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${id}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Tarea no encontrada', data: null };
      return { success: true, data: data.data || data };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async create(taskData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks`, {
        method:  'POST',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(this._buildPayload(taskData)),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: this._extractError(data, res.status), data: null };
      return { success: true, message: data.message || 'Tarea creada', data: data.data };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async update(id, taskData) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${id}`, {
        method:  'PUT',
        headers: apiConfig.getHeaders(true),
        body:    JSON.stringify(this._buildPayload(taskData)),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: this._extractError(data, res.status), data: null };
      return { success: true, message: data.message || 'Tarea actualizada', data: data.data };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async delete(id) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${id}`, {
        method:  'DELETE',
        headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error al eliminar tarea' };
      return { success: true, message: data.message || 'Tarea eliminada' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  // Extracts the most descriptive error message from any .NET API response format
  _extractError(data, status) {
    if (!data) return `Error ${status}`;

    // Standard wrapper: { message: "..." }
    if (data.message) return data.message;
    if (data.Message) return data.Message;

    // ASP.NET Core validation ProblemDetails: { title, errors: { field: ["msg"] } }
    if (data.errors) {
      const msgs = Object.entries(data.errors)
        .flatMap(([field, errs]) =>
          Array.isArray(errs) ? errs.map(e => `${field}: ${e}`) : [`${field}: ${errs}`]
        );
      if (msgs.length > 0) return msgs.join(' | ');
    }
    if (data.title) return data.title;

    // Fallback: stringify whatever came back
    const str = JSON.stringify(data);
    return str.length < 300 ? str : `Error ${status}`;
  }

  _buildPayload(d) {
    return {
      name:            d.name,
      idClient:        d.idClient        || null,
      idGroup:         d.idGroup         || null,
      idTypeTask:      d.idTypeTask      || null,
      idEmployee:      d.idEmployee      || null,
      idStatus:        d.idStatus        || null,
      idLocation:      d.idLocation      || null,
      idContact:       d.idContact       || null,
      idPriority:      215,
      idClientAccount: d.idClientAccount || null,
      idParentTask:    d.idParentTask    || null,
      startDateTime:   d.startDateTime   || null,
      dueDateTime:     d.dueDateTime     || null,
      dia:             parseInt(d.dia)     || 0,
      horas:           parseInt(d.horas)   || 0,
      minutos:         parseInt(d.minutos) || 0,
      description:     d.description     || null,
      fiscalYear:      d.fiscalYear      ? parseInt(d.fiscalYear)      : null,
      policyExpDate:   d.policyExpDate   || null,
      datePaid:        d.datePaid        || null,
      isActive:        d.isActive !== undefined ? d.isActive : true,
      participantIds:  d.participantIds  || [],
      supervisorIds:   d.supervisorIds   || [],
      appointmentIds:  d.appointmentIds  || [],
    };
  }

  // ── COMMENTS ─────────────────────────────────────────────────────────────

  async getComments(taskId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/comments`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async addComment(taskId, comment) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/comments`, {
        method: 'POST', headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Comentario agregado' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async updateComment(taskId, commentId, comment) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT', headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Comentario actualizado' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async deleteComment(taskId, commentId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE', headers: apiConfig.getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Comentario eliminado' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────

  async search(searchRequest) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/search`, {
        method: 'POST', headers: apiConfig.getHeaders(true),
        body: JSON.stringify(searchRequest),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ── VALIDATION ────────────────────────────────────────────────────────────

  async taskExists(name, idTypeTask, idClient, idTask = null) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/validate/exists`, {
        method: 'POST', headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ name, idTypeTask, idClient, idTask }),
      });
      const data = await res.json();
      return { success: true, exists: data.data === true };
    } catch (e) {
      return { success: false, exists: false };
    }
  }

  // ── CATALOG METHODS ───────────────────────────────────────────────────────

  async getGroups() {
    return this._getCatalog('catalogs/groups');
  }

  async getTypeTask() {
    return this._getCatalog('catalogs/typetasks');
  }

  async getTypeTasksByGroup(groupId) {
    return this._getCatalog(`catalogs/typetasks/group/${groupId}`);
  }

  async getStatusByTypeTask(typeTaskId) {
    return this._getCatalog(`catalogs/statuses/${typeTaskId}`);
  }

  async getPriorities() {
    return this._getCatalog('catalogs/priorities');
  }

  async getClientsDropdown() {
    return this._getCatalog('catalogs/clients');
  }

  async getClientsForSearch() {
    return this._getCatalog('catalogs/clients/search');
  }

  async getClientDetails(clientId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/catalogs/clients/${clientId}/details`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data || null };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async getContactsByClient(clientId) {
    return this._getCatalog(`catalogs/contacts/${clientId}`);
  }

  async getClientAccountsByClient(clientId) {
    return this._getCatalog(`catalogs/clientaccounts/${clientId}`);
  }

  async getEmployees() {
    return this._getCatalog('catalogs/employees');
  }

  async getLocations() {
    return this._getCatalog('catalogs/locations');
  }

  async getFiscalYears() {
    return this._getCatalog('catalogs/fiscalyears');
  }

  async getPeriods() {
    return this._getCatalog('catalogs/periods');
  }

  async getVisibility(typeTaskId) {
    return this._getCatalog(`catalogs/visibility/${typeTaskId}`);
  }

  async getStatusBilling() {
    return this._getCatalog('catalogs/statusbilling');
  }

  async getChecklistStatuses() {
    return this._getCatalog('catalogs/checkliststatuses');
  }

  // ── CHECKLIST ─────────────────────────────────────────────────────────────

  async getChecklist(taskId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/checklist`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  async updateChecklistItem(taskId, itemId, statusId, receivedDate = null, notes = undefined) {
    try {
      const body = { statusId, receivedDate };
      if (notes !== undefined) body.notes = notes;
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/checklist/${itemId}`, {
        method: 'PUT', headers: apiConfig.getHeaders(true),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Actualizado' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async sendNotification(taskId, checklistItemIds) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/checklist/notify`, {
        method: 'POST', headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ checklistItemIds }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true, message: data.message || 'Notificación enviada' };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }


  // ── NOTIFICATION HISTORY ──────────────────────────────────────────────────

  async getNotificationHistory(taskId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/notifications`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }

  // ── NOTIFICATION SETTINGS ────────────────────────────────────────────────

  async getNotificationSettingCatalog(tipo) {
    return this._getCatalog(`catalogs/notificationsettings/${tipo}`);
  }

  async getNotificationSettings(taskId) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/notifications/settings`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
      return { success: true, data: data.data || {} };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: null };
    }
  }

  async updateNotificationSetting(taskId, tipo, value) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${taskId}/notifications/settings`, {
        method: 'PUT', headers: apiConfig.getHeaders(true),
        body: JSON.stringify({ tipo, value: value || null }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Error de conexión' };
    }
  }

  async _getCatalog(path) {
    try {
      const res  = await fetch(`${apiConfig.baseURL}/Tasks/${path}`, { headers: apiConfig.getHeaders(true) });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error', data: [] };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Error de conexión', data: [] };
    }
  }
}

export default new TaskService();
