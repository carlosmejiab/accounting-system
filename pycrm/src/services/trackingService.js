// ===================================
// TRACKING SERVICE
// ===================================

import apiConfig from '../config/api';

const base = () => `${apiConfig.baseURL}/tracking`;
const hdrs = () => apiConfig.getHeaders(true);

const _req = async (url, method = 'GET', body = null) => {
  try {
    const opts = { method, headers: hdrs() };
    if (body !== null) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Error', data: null };
    return { success: true, data: data.data ?? null, message: data.message || '' };
  } catch {
    return { success: false, message: 'Connection error', data: null };
  }
};

const trackingService = {
  /** Get all trackings for a task */
  getByTask:    (idTask)                      => _req(`${base()}/task/${idTask}`),

  /** Create a new tracking entry */
  create:       (payload)                     => _req(`${base()}`,          'POST', payload),

  /** Set status to Working, record start time */
  play:         (idTracking)                  => _req(`${base()}/${idTracking}/play`,  'PUT'),

  /** Accumulate time, set status to Paused */
  pause:        (idTracking, secondsWorked)   => _req(`${base()}/${idTracking}/pause`, 'PUT', { secondsWorked }),

  /** Accumulate time, set status to Completed */
  stop:         (idTracking, secondsWorked)   => _req(`${base()}/${idTracking}/stop`,  'PUT', { secondsWorked }),

  /** Dropdown options for status */
  getStatuses:  ()                            => _req(`${base()}/statuses`),

  /** Dropdown options for employees */
  getEmployees: ()                            => _req(`${base()}/employees`),
};

export default trackingService;
