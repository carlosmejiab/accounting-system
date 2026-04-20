// ===================================
// TASKS — search-first, modal-based CRM module
// ===================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import taskService from '../services/taskService';
import trackingService from '../services/trackingService';
import MultiSelect from './MultiSelect';
import '../styles/Tasks.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const SS_KEY = 'tasks_search_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};
const fmtInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
};
const fmtDateTimeInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fmtDateTime = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatSeconds = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const secs = parseInt(seconds, 10);
  if (isNaN(secs) || secs === 0) return '0 sec';
  if (secs < 60) return `${secs} sec`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMins} min`;
};

const priorityBadge = (name) => {
  if (!name) return <span className="tsk-badge tsk-badge-secondary">—</span>;
  const n = name.toLowerCase();
  if (n.includes('high') || n.includes('alta'))  return <span className="tsk-badge tsk-badge-danger">{name}</span>;
  if (n.includes('med')  || n.includes('media')) return <span className="tsk-badge tsk-badge-warning">{name}</span>;
  if (n.includes('low')  || n.includes('baja'))  return <span className="tsk-badge tsk-badge-info">{name}</span>;
  return <span className="tsk-badge tsk-badge-secondary">{name}</span>;
};

const statusBadge = (name) => {
  if (!name) return <span className="tsk-badge tsk-badge-secondary">—</span>;
  return <span className="tsk-badge tsk-badge-info">{name}</span>;
};

const trackingStatusColor = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'working'   || s.includes('work')) return { bg: '#dcfce7', text: '#16a34a', border: '#86efac' };
  if (s === 'paused'    || s === 'pause' || s.includes('paus')) return { bg: '#fef9c3', text: '#ca8a04', border: '#fde047' };
  if (s === 'completed' || s === 'complete'  || s.includes('comp')) return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
  if (s && s !== '—') return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' };
  return null;
};

const trackingStatusIdLabel = (idStatus) => {
  if (idStatus === 55) return 'Working';
  if (idStatus === 54) return 'Paused';
  if (idStatus === 56) return 'Completed';
  return null;
};

const trackingStatusBadge = (status, idStatus) => {
  const label  = (status && status !== '—') ? status : (trackingStatusIdLabel(idStatus) ?? '—');
  const colors = trackingStatusColor(label);
  if (!colors) return <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>—</span>;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
      backgroundColor: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.03em',
    }}>
      {label}
    </span>
  );
};

// ── Empty form ─────────────────────────────────────────────────────────────────
const emptyForm = {
  name: '', idClient: '', idGroup: '', idTypeTask: '', idEmployee: '',
  idStatus: '', idPriority: '', idLocation: '', idContact: '', idClientAccount: '',
  idParentTask: '', parentTaskName: '', startDateTime: '', dueDateTime: '',
  dia: '', horas: '', minutos: '',
  fiscalYear: '', policyExpDate: '', datePaid: '', description: '', isActive: true,
  participantIds: [], supervisorIds: [], appointmentIds: [],
};

// ── URL / Session utilities ────────────────────────────────────────────────────
function readUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    mode:       p.get('m')   || null,
    taskNums:   p.get('nums') || '',
    clientId:   p.get('cid') ? parseInt(p.get('cid'), 10) : null,
    clientText: p.get('ct')  || '',
    periodId:   p.get('pid') ? parseInt(p.get('pid'), 10) : null,
    dateFrom:   p.get('df')  || '',
    dateTo:     p.get('dt')  || '',
  };
}

function buildQs(mode, params, clientText) {
  const p = new URLSearchParams();
  if (mode === 'numbers') { p.set('m', 'nums');   p.set('nums', params.numbers); }
  if (mode === 'client')  { p.set('m', 'client'); p.set('cid', String(params.clientId)); if (clientText) p.set('ct', clientText); }
  if (mode === 'period')  { p.set('m', 'period'); p.set('pid', String(params.periodId)); }
  if (mode === 'dates')   { p.set('m', 'dates');  p.set('df', params.dateFrom); p.set('dt', params.dateTo); }
  return p.toString();
}

function writeUrl(qs) {
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

function saveSession(mode, params, ui) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify({ mode, params, ui })); } catch {}
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); } catch { return null; }
}

function describeSearch(mode, params, clientText) {
  if (mode === 'numbers') return `task number(s): ${params.numbers}`;
  if (mode === 'client')  return `client: ${clientText || params.clientId}`;
  if (mode === 'period')  return 'the selected period';
  if (mode === 'dates')   return `${params.dateFrom} to ${params.dateTo}`;
  return 'the current filters';
}

// ── CheckboxList ───────────────────────────────────────────────────────────────
const CheckboxList = ({ items, selected, onChange }) => {
  const toggle = (id) => {
    const num = parseInt(id, 10);
    onChange(selected.includes(num) ? selected.filter(x => x !== num) : [...selected, num]);
  };
  return (
    <div className="tsk-checkbox-list">
      {items.length === 0
        ? <span className="tsk-checkbox-empty">No employees</span>
        : items.map(item => (
            <label key={item.idEmployee} className="tsk-checkbox-item">
              <input
                type="checkbox"
                checked={selected.includes(item.idEmployee)}
                onChange={() => toggle(item.idEmployee)}
              />
              {item.fullName}
            </label>
          ))
      }
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function Tasks() {

  // ── List state ────────────────────────────────────────────────────────────
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [listMsg,     setListMsg]     = useState({ type: '', text: '' });
  const [searchError, setSearchError] = useState(null);
  const [lastSearch,  setLastSearch]  = useState(null); // { mode, params, clientText }
  const [searching,   setSearching]   = useState(false);

  // ── Flat search filter state (replaces tab system) ────────────────────────
  const [filterTaskNums,   setFilterTaskNums]   = useState('');
  const [filterClientText, setFilterClientText] = useState('');
  const [filterClientId,   setFilterClientId]   = useState(null);
  const [filterPeriodId,   setFilterPeriodId]   = useState('');
  const [filterDateFrom,   setFilterDateFrom]   = useState('');
  const [filterDateTo,     setFilterDateTo]     = useState('');

  // ── Autocomplete state ────────────────────────────────────────────────────
  const [debouncedClientText,   setDebouncedClientText]   = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [highlightedIdx,        setHighlightedIdx]        = useState(-1);

  // ── Column filters ────────────────────────────────────────────────────────
  const [colFilter, setColFilter] = useState({});

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalType,        setModalType]        = useState(null);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [selectedTaskRow,  setSelectedTaskRow]  = useState(null);

  // ── Detail / edit state ───────────────────────────────────────────────────
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskDetail,     setTaskDetail]     = useState(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [activeTab,      setActiveTab]      = useState('details');
  const [showDelConfirm, setShowDelConfirm] = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [detailMsg,      setDetailMsg]      = useState({ type: '', text: '' });

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);

  // ── Client modal state ────────────────────────────────────────────────────
  const [clientDetails,        setClientDetails]        = useState(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);

  // ── Tracking modal state ──────────────────────────────────────────────────
  const [trackingList,      setTrackingList]      = useState([]);
  const [trackingLoading,   setTrackingLoading]   = useState(false);
  const [trackingEmployees, setTrackingEmployees] = useState([]);
  const [savingTracking,    setSavingTracking]    = useState(false); // eslint-disable-line no-unused-vars
  const [savingQuickCreate, setSavingQuickCreate] = useState(false);
  const [trackingMsg,       setTrackingMsg]       = useState({ type: '', text: '' });
  const [activeTrackingId,  setActiveTrackingId]  = useState(null);
  const [selectedTracking,  setSelectedTracking]  = useState(null);
  const [timerVisible,      setTimerVisible]      = useState(false);
  const [timerCondition,    setTimerCondition]    = useState('');
  const [timerDisplay,      setTimerDisplay]      = useState(0);
  const [showQuickCreate,   setShowQuickCreate]   = useState(false);
  const [quickCreateForm,   setQuickCreateForm]   = useState({ name: '', startDateTime: '', dueDateTime: '', idEmployee: '' });
  const timerIntervalRef   = useRef(null);
  const timerStartEpochRef = useRef(null);
  const timerOffsetRef     = useRef(0);    // seconds already worked in previous sessions
  // Persists playedAt across modal close/reopen: { [idTracking]: isoString }
  const playTimestampsRef  = useRef({});
  // Persists exact paused seconds (DB only stores minutes, losing sub-minute precision)
  const pauseSecondsRef    = useRef({});  // { [idTracking]: exactSeconds }

  // ── localStorage helpers — survive page refresh and browser close ──────────
  // Stores: { playedAt: isoString, offsetSeconds: number }
  // so we can fully reconstruct timer state without any API data.
  const LS_PLAY_KEY  = 'trk_play_ts';
  const lsGetAll     = () => { try { return JSON.parse(localStorage.getItem(LS_PLAY_KEY) || '{}'); } catch { return {}; } };
  const lsGetEntry   = (id) => lsGetAll()[String(id)] ?? null;
  const lsSaveEntry  = (id, playedAt, offsetSeconds) => {
    const d = lsGetAll(); d[String(id)] = { playedAt, offsetSeconds };
    localStorage.setItem(LS_PLAY_KEY, JSON.stringify(d));
  };
  const lsClearEntry = (id) => {
    const d = lsGetAll(); delete d[String(id)];
    localStorage.setItem(LS_PLAY_KEY, JSON.stringify(d));
  };

  // ── Catalogs ──────────────────────────────────────────────────────────────
  const [groups,           setGroups]           = useState([]);
  const [typeTasksList,    setTypeTasksList]     = useState([]);
  const [statusList,       setStatusList]        = useState([]);
  const [priorities,       setPriorities]        = useState([]);
  const [employees,        setEmployees]         = useState([]);
  const [locations,        setLocations]         = useState([]);
  const [fiscalYears,      setFiscalYears]       = useState([]);
  const [periods,          setPeriods]           = useState([]);
  const [clients,          setClients]           = useState([]);
  const [clientsForSearch, setClientsForSearch]  = useState([]);
  const [contacts,         setContacts]          = useState([]);
  const [clientAccounts,   setClientAccounts]    = useState([]);
  const [visibility,       setVisibility]        = useState({ showApptWith: false, showDatePaid: false });
  const [typeTasksFiltered, setTypeTasksFiltered] = useState([]);
  const [groupFiltered,    setGroupFiltered]     = useState(false);
  const [catalogsReady,    setCatalogsReady]     = useState(false);

  // ── MultiSelect UI state (parallel to formData, converted on save) ────────
  const [msEmployee,     setMsEmployee]     = useState([]);
  const [msContact,      setMsContact]      = useState([]);
  const [msClientAcct,   setMsClientAcct]   = useState([]);
  const [msParticipants, setMsParticipants] = useState([]);
  const [msSupervisors,  setMsSupervisors]  = useState([]);
  const [msApptWith,     setMsApptWith]     = useState([]);

  // ── Comments state ────────────────────────────────────────────────────────
  const [newComment,      setNewComment]      = useState('');
  const [savingComment,   setSavingComment]   = useState(false);
  const [editingComment,  setEditingComment]  = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // ── Checklist state ───────────────────────────────────────────────────────
  const [checklist,           setChecklist]           = useState([]);
  const [checklistStatuses,   setChecklistStatuses]   = useState([]);
  const [checklistLoading,    setChecklistLoading]    = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  // ── Notification history state ────────────────────────────────────────────
  const [notifHistory,  setNotifHistory]  = useState([]);
  const [notifLoading,  setNotifLoading]  = useState(false);

  // ── Notification settings state ───────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({ deliveryMethod: '', frequencyDelivery: '', deliveryDate: '', conditionsNotification: '' });
  const [notifCatalogs, setNotifCatalogs] = useState({ deliveryMethods: [], frequencies: [], conditions: [] });
  const [notifSettingsLoading, setNotifSettingsLoading] = useState(false);
  const [manualMessage, setManualMessage] = useState('');

  // ── Panel / pagination / validation state ────────────────────────────────
  const [filterPanelOpen, setFilterPanelOpen] = useState(() => {
    try { return localStorage.getItem('tsk_panel_open') !== 'false'; } catch { return true; }
  });
  const [taskNumError, setTaskNumError] = useState('');
  const [dateError,    setDateError]    = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(20);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const successTimerRef           = useRef(null);
  const clientSuggestionMouseDown = useRef(false);
  const requestIdRef              = useRef(0);
  const debounceTimerRef          = useRef(null);
  const triggerBtnRef             = useRef(null); // focus return after modal close

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD CATALOGS (once per mount)
  // ─────────────────────────────────────────────────────────────────────────
  const loadCatalogs = useCallback(async () => {
    const [grpR, ttR, priR, empR, locR, fyR, perR, cliR, cliSR, csR] = await Promise.all([
      taskService.getGroups(),
      taskService.getTypeTask(),
      taskService.getPriorities(),
      taskService.getEmployees(),
      taskService.getLocations(),
      taskService.getFiscalYears(),
      taskService.getPeriods(),
      taskService.getClientsDropdown(),
      taskService.getClientsForSearch(),
      taskService.getChecklistStatuses(),
    ]);
    if (grpR.success)  setGroups(grpR.data);
    if (ttR.success)   setTypeTasksList(ttR.data);
    if (priR.success)  setPriorities(priR.data);
    if (empR.success)  setEmployees(empR.data);
    if (locR.success)  setLocations(locR.data);
    if (fyR.success)   setFiscalYears(fyR.data);
    if (perR.success)  setPeriods(perR.data);
    if (cliR.success)  setClients(cliR.data);
    if (cliSR.success) setClientsForSearch(cliSR.data);
    if (csR.success)   setChecklistStatuses(csR.data);
    setCatalogsReady(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // EXECUTE SEARCH — single entry point; request-ID guards stale responses
  // ─────────────────────────────────────────────────────────────────────────
  const executeSearch = useCallback(async (mode, params, uiClientText = '') => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setSearching(true);
    setSearchError(null);
    try {
      const res = await taskService.search({ mode, ...params });
      if (reqId !== requestIdRef.current) return; // stale — discard
      if (res.success) {
        setTasks(res.data);
        setLastUpdated(new Date());
        const search = { mode, params, clientText: uiClientText };
        setLastSearch(search);
        writeUrl(buildQs(mode, params, uiClientText));
        saveSession(mode, params, { clientText: uiClientText });
      } else {
        setSearchError(res.message || 'Search failed. Please try again.');
      }
    } catch {
      if (reqId !== requestIdRef.current) return;
      setSearchError('Connection error. Please try again.');
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
        setSearching(false);
      }
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!lastSearch) return;
    await executeSearch(lastSearch.mode, lastSearch.params, lastSearch.clientText);
  }, [lastSearch, executeSearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // ON MOUNT — restore from URL → sessionStorage → execute
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadCatalogs();

    const url = readUrlParams();
    let r = null;

    if (url.mode) {
      r = url;
    } else {
      const ss = loadSession();
      if (ss) {
        r = {
          mode:       ss.mode,
          taskNums:   ss.mode === 'numbers' ? ss.params?.numbers   : '',
          clientId:   ss.mode === 'client'  ? ss.params?.clientId  : null,
          clientText: ss.ui?.clientText || '',
          periodId:   ss.mode === 'period'  ? ss.params?.periodId  : null,
          dateFrom:   ss.mode === 'dates'   ? ss.params?.dateFrom  : '',
          dateTo:     ss.mode === 'dates'   ? ss.params?.dateTo    : '',
        };
      }
    }

    if (r) {
      if (r.taskNums)   setFilterTaskNums(r.taskNums);
      if (r.clientText) { setFilterClientText(r.clientText); setDebouncedClientText(r.clientText); }
      if (r.clientId)   setFilterClientId(r.clientId);
      if (r.periodId)   setFilterPeriodId(String(r.periodId));
      if (r.dateFrom)   setFilterDateFrom(r.dateFrom);
      if (r.dateTo)     setFilterDateTo(r.dateTo);

      if (r.mode === 'numbers' && r.taskNums) {
        executeSearch('numbers', { numbers: r.taskNums });
      } else if (r.mode === 'client' && r.clientId) {
        executeSearch('client', { clientId: r.clientId }, r.clientText || '');
      } else if (r.mode === 'period' && r.periodId) {
        executeSearch('period', { periodId: parseInt(r.periodId, 10) });
      } else if (r.mode === 'dates' && r.dateFrom && r.dateTo) {
        executeSearch('dates', { dateFrom: r.dateFrom, dateTo: r.dateTo });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key closes active modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && modalType) closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }); // no deps — re-binds each render so closeModal is always current

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const showSuccess = (msg, setMsg) => {
    clearTimeout(successTimerRef.current);
    setMsg({ type: 'success', text: msg });
    successTimerRef.current = setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const isBillingTypeTask = (idTypeTask) => {
    if (!idTypeTask) return false;
    const tt = typeTasksList.find(t => t.idTypeTask === parseInt(idTypeTask, 10));
    return tt?.name?.toLowerCase() === 'billing';
  };

  const isOtherTypeTask = (idTypeTask) => {
    if (!idTypeTask) return true;
    const tt = typeTasksList.find(t => t.idTypeTask === parseInt(idTypeTask, 10));
    const n = tt?.name?.toLowerCase() || '';
    return !tt || n === 'other' || n === 'otros';
  };

  const isBookingTypeTask = (idTypeTask) => {
    if (!idTypeTask) return false;
    const tt = typeTasksList.find(t => t.idTypeTask === parseInt(idTypeTask, 10));
    return !!(tt?.name?.toLowerCase().includes('book'));
  };

  const loadStatusesForTypeTask = async (idTypeTask) => {
    if (!idTypeTask) { setStatusList([]); return; }
    const res = isBillingTypeTask(idTypeTask)
      ? await taskService.getStatusBilling()
      : await taskService.getStatusByTypeTask(idTypeTask);
    if (res.success) setStatusList(res.data);
  };

  const loadVisibility = async (idTypeTask) => {
    if (!idTypeTask) { setVisibility({ showApptWith: false, showDatePaid: false }); return; }
    const res = await taskService.getVisibility(idTypeTask);
    if (res.success) setVisibility(res.data);
  };

  const loadContactsAndAccounts = async (idClient) => {
    if (!idClient) { setContacts([]); setClientAccounts([]); return; }
    const [cR, aR] = await Promise.all([
      taskService.getContactsByClient(idClient),
      taskService.getClientAccountsByClient(idClient),
    ]);
    if (cR.success) setContacts(cR.data);
    if (aR.success) setClientAccounts(aR.data);
  };

  // ── MultiSelect option arrays (memoized) ──────────────────────────────────
  const employeeOptions    = useMemo(() => employees.map(e    => ({ value: e.idEmployee,     label: e.fullName        })), [employees]);
  const contactOptions     = useMemo(() => contacts.map(c     => ({ value: c.idContact,      label: c.firstName       })), [contacts]);
  const clientAcctOptions  = useMemo(() => clientAccounts.map(a => ({ value: a.idClientAccount, label: a.clienteAccount })), [clientAccounts]);

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH LOGIC
  // Priority: taskNums > client > period > dates
  // ─────────────────────────────────────────────────────────────────────────
  const resolveSearch = useCallback(() => {
    if (filterTaskNums.trim()) {
      const parts = filterTaskNums.trim().split(/[\s,;]+/).filter(Boolean);
      const invalid = parts.filter(p => !/^\d+$/.test(p));
      if (invalid.length > 0) {
        setListMsg({ type: 'error', text: `Invalid task numbers: ${invalid.join(', ')}` });
        return null;
      }
      return { mode: 'numbers', params: { numbers: [...new Set(parts)].join(',') } };
    }
    if (filterClientId) {
      return { mode: 'client', params: { clientId: filterClientId } };
    }
    if (filterPeriodId) {
      return { mode: 'period', params: { periodId: parseInt(filterPeriodId, 10) } };
    }
    if (filterDateFrom && filterDateTo) {
      return { mode: 'dates', params: { dateFrom: filterDateFrom, dateTo: filterDateTo } };
    }
    if (filterDateFrom || filterDateTo) {
      setListMsg({ type: 'error', text: 'Both start date and end date are required' });
      return null;
    }
    return null;
  }, [filterTaskNums, filterClientId, filterPeriodId, filterDateFrom, filterDateTo]);

  const handleSearch = useCallback(async () => {
    setListMsg({ type: '', text: '' });
    const resolved = resolveSearch();
    if (!resolved) {
      if (!filterTaskNums.trim() && !filterClientId && !filterPeriodId && !filterDateFrom && !filterDateTo) {
        setListMsg({ type: 'error', text: 'Please enter at least one search criteria' });
      }
      return;
    }
    await executeSearch(resolved.mode, resolved.params, filterClientText);
  }, [resolveSearch, executeSearch, filterTaskNums, filterClientId, filterPeriodId, filterDateFrom, filterDateTo, filterClientText]);

  // Period auto-triggers on select (clears other filters to avoid ambiguity)
  const handlePeriodChange = useCallback(async (e) => {
    const val = e.target.value;
    setFilterPeriodId(val);
    setFilterClientId(null);
    setFilterClientText('');
    setDebouncedClientText('');
    setFilterTaskNums('');
    if (val) {
      setTasks([]);
      await executeSearch('period', { periodId: parseInt(val, 10) });
    }
  }, [executeSearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // CLIENT AUTOCOMPLETE — 300ms debounce
  // ─────────────────────────────────────────────────────────────────────────
  const handleClientTextChange = useCallback((e) => {
    const val = e.target.value;
    setFilterClientText(val);
    setFilterClientId(null);
    setShowClientSuggestions(true);
    setHighlightedIdx(-1);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedClientText(val), 300);
  }, []);

  const clientSuggestions = useMemo(() => {
    if (!filterClientText || filterClientText.length < 1) return [];
    return clientsForSearch
      .filter(c => c.name.toLowerCase().includes(filterClientText.toLowerCase()))
      .slice(0, 15);
  }, [filterClientText, clientsForSearch]);

  const handleClientSelect = useCallback(async (client) => {
    setFilterClientText(client.name);
    setDebouncedClientText(client.name);
    setFilterClientId(client.idClient);
    setShowClientSuggestions(false);
    setHighlightedIdx(-1);
    await executeSearch('client', { clientId: client.idClient }, client.name);
  }, [executeSearch]);

  const handleClientKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowClientSuggestions(false);
      setHighlightedIdx(-1);
      return;
    }
    if (!showClientSuggestions || clientSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, clientSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx >= 0 && clientSuggestions[highlightedIdx]) {
        handleClientSelect(clientSuggestions[highlightedIdx]);
      }
    }
  }, [showClientSuggestions, clientSuggestions, highlightedIdx, handleClientSelect]);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVE FILTER INDICATOR
  // ─────────────────────────────────────────────────────────────────────────
  const hasTaskNums      = filterTaskNums.trim() !== '';
  const hasOtherFilters  = !!(filterClientId || filterPeriodId || filterDateFrom || filterDateTo);
  const showNumWarning   = hasTaskNums && hasOtherFilters;

  // ─────────────────────────────────────────────────────────────────────────
  // COLUMN FILTERS — useMemo, single object
  // ─────────────────────────────────────────────────────────────────────────
  const updateColFilter = useCallback((key, value) => {
    setColFilter(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearColFilters = useCallback(() => setColFilter({}), []);

  const hasColFilters = Object.values(colFilter).some(Boolean);

  const filteredTasks = useMemo(() => {
    const entries = Object.entries(colFilter).filter(([, v]) => v);
    if (entries.length === 0) return tasks;
    return tasks.filter(t =>
      entries.every(([key, val]) =>
        String(t[key] ?? '').toLowerCase().includes(val.toLowerCase())
      )
    );
    // SUGGESTION: consider virtualization (react-window) if dataset consistently exceeds 500 rows after filtering
  }, [tasks, colFilter]);

  const pagedTasks = useMemo(() => {
    return filteredTasks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredTasks, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);

  // Reset to page 1 whenever the filtered list or page size changes
  useEffect(() => { setCurrentPage(1); }, [filteredTasks.length, rowsPerPage]);

  const activeBadges = useMemo(() => {
    const badges = [];
    if (filterTaskNums.trim()) badges.push({ key: 'nums', label: `#${filterTaskNums.trim()}` });
    if (filterClientId) badges.push({ key: 'client', label: `Client: ${filterClientText}` });
    if (filterPeriodId) {
      const p = periods.find(x => String(x.idTabla) === String(filterPeriodId));
      badges.push({ key: 'period', label: `Period: ${p?.description || filterPeriodId}` });
    }
    if (filterDateFrom) badges.push({ key: 'df', label: `From: ${filterDateFrom}` });
    if (filterDateTo)   badges.push({ key: 'dt', label: `To: ${filterDateTo}` });
    return badges;
  }, [filterTaskNums, filterClientId, filterClientText, filterPeriodId, periods, filterDateFrom, filterDateTo]);

  const removeBadge = useCallback((key) => {
    if (key === 'nums')   { setFilterTaskNums(''); setTaskNumError(''); }
    if (key === 'client') { setFilterClientId(null); setFilterClientText(''); setDebouncedClientText(''); }
    if (key === 'period') setFilterPeriodId('');
    if (key === 'df')     { setFilterDateFrom(''); setDateError(''); }
    if (key === 'dt')     { setFilterDateTo(''); setDateError(''); }
  }, []);

  const handleClearAll = useCallback(() => {
    setFilterTaskNums(''); setTaskNumError('');
    setFilterClientId(null); setFilterClientText(''); setDebouncedClientText('');
    setFilterPeriodId('');
    setFilterDateFrom(''); setFilterDateTo(''); setDateError('');
    setTasks([]); setLastSearch(null); setLastUpdated(null);
    writeUrl('');
    try { sessionStorage.removeItem(SS_KEY); } catch {}
  }, []);

  function paginationPages(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4)         return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL OPENERS / CLOSERS
  // ─────────────────────────────────────────────────────────────────────────
  const openCreate = useCallback((e) => {
    triggerBtnRef.current = e?.currentTarget || null;
    setFormData(emptyForm);
    setStatusList([]);
    setVisibility({ showApptWith: false, showDatePaid: false });
    setContacts([]);
    setClientAccounts([]);
    setGroupFiltered(false);
    setTypeTasksFiltered([]);
    setMsEmployee([]);
    setMsContact([]);
    setMsClientAcct([]);
    setMsParticipants([]);
    setMsSupervisors([]);
    setMsApptWith([]);
    setDetailMsg({ type: '', text: '' });
    setModalType('create');
  }, []);

  const openEdit = useCallback(async (taskId, triggerEl = null) => {
    triggerBtnRef.current = triggerEl;
    setSelectedTaskId(taskId);
    setActiveTab('details');
    setDetailMsg({ type: '', text: '' });
    setDetailLoading(true);
    setShowDelConfirm(false);
    setChecklist([]);
    setNotifHistory([]);
    setModalType('edit');

    const res = await taskService.getById(taskId);
    if (!res.success) {
      setDetailMsg({ type: 'error', text: res.message });
      setDetailLoading(false);
      return;
    }
    const d = res.data;
    setTaskDetail(d);
    setFormData({
      name:            d.name            || '',
      idClient:        d.idClient        || '',
      idGroup:         d.idGroup         || '',
      idTypeTask:      d.idTypeTask      || '',
      idEmployee:      d.idEmployee      || '',
      idStatus:        d.idStatus        || '',
      idPriority:      d.idPriority      || '',
      idLocation:      d.idLocation      || '',
      idContact:       d.idContact       || '',
      idClientAccount: d.idClientAccount || '',
      idParentTask:    d.idParentTask    || '',
      parentTaskName:  d.parentTaskName  || '',
      startDateTime:   fmtDateTimeInput(d.startDateTime),
      dueDateTime:     fmtDateTimeInput(d.dueDateTime),
      dia:             d.dia     ?? '',
      horas:           d.horas   ?? '',
      minutos:         d.minutos ?? '',
      fiscalYear:      d.fiscalYear      || '',
      policyExpDate:   fmtDateTimeInput(d.policyExpDate),
      datePaid:        fmtDateTimeInput(d.datePaid),
      description:     d.description     || '',
      isActive:        d.isActive !== false,
      participantIds:  (d.participants  || []).filter(e => e.state).map(e => e.idEmployee),
      supervisorIds:   (d.supervisors   || []).filter(e => e.state).map(e => e.idEmployee),
      appointmentIds:  (d.appointments  || []).filter(e => e.state).map(e => e.idEmployee),
    });
    const loaders = [];
    if (d.idTypeTask) loaders.push(loadStatusesForTypeTask(d.idTypeTask), loadVisibility(d.idTypeTask));
    if (d.idClient)   loaders.push(loadContactsAndAccounts(d.idClient));
    if (d.idGroup) {
      loaders.push(
        taskService.getTypeTasksByGroup(d.idGroup).then(r => {
          if (r.success) { setTypeTasksFiltered(r.data); setGroupFiltered(true); }
        })
      );
    } else {
      setGroupFiltered(false);
      setTypeTasksFiltered([]);
    }
    await Promise.all(loaders);

    // ── Sync MultiSelect states from loaded task data ──────────────────────
    // "Assigned To" mirrors original lstBoxTest: all participants with state=true are pre-selected.
    // Falls back to the single idEmployee when no participant records exist yet.
    const assignedParticipants = (d.participants || []).filter(p => p.state);
    setMsEmployee(
      assignedParticipants.length > 0
        ? assignedParticipants.map(p => ({ value: p.idEmployee, label: p.fullName || p.employeeName || `Employee ${p.idEmployee}` }))
        : employees
            .filter(e => e.idEmployee === parseInt(d.idEmployee, 10))
            .map(e => ({ value: e.idEmployee, label: e.fullName }))
    );
    setMsParticipants(assignedParticipants.map(p => ({ value: p.idEmployee, label: p.fullName || p.employeeName || `Employee ${p.idEmployee}` })));
    setMsSupervisors(
      (d.supervisors || [])
        .filter(s => s.state)
        .map(s => ({ value: s.idEmployee, label: s.fullName || s.employeeName || `Employee ${s.idEmployee}` }))
    );
    setMsApptWith(
      (d.appointments || [])
        .filter(a => a.state)
        .map(a => ({ value: a.idEmployee, label: a.fullName || a.employeeName || `Employee ${a.idEmployee}` }))
    );
    // Contact and ClientAccount depend on contacts/clientAccounts loaded above
    setMsContact([]);
    setMsClientAcct([]);

    setDetailLoading(false);
    loadChecklist(taskId);
    loadNotifHistory(taskId);
    loadNotifSettings(taskId);
  }, [employees]); // eslint-disable-line react-hooks/exhaustive-deps

  const openClientModal = useCallback(async (task, triggerEl = null) => {
    triggerBtnRef.current = triggerEl;
    setSelectedTaskRow(task);
    setClientDetails(null);
    setClientDetailsLoading(true);
    setModalType('client');
    const res = await taskService.getClientDetails(task.idClient);
    if (res.success) setClientDetails(res.data);
    setClientDetailsLoading(false);
  }, []);

  const loadTrackings = useCallback(async (idTask) => {
    if (!idTask) return;
    try {
      const res = await trackingService.getByTask(idTask);
      const items = res?.data ?? res?.Data ?? [];
      setTrackingList(Array.isArray(items) ? items : []);
    } catch {
      setTrackingList([]);
    }
  }, []);

  const openTrackingModal = useCallback(async (task, triggerEl = null) => {
    triggerBtnRef.current = triggerEl;
    setSelectedTaskRow(task);
    setSelectedTaskId(task.idTask);
    setTrackingList([]);
    setTrackingMsg({ type: '', text: '' });
    setSelectedTracking(null);
    setTimerVisible(false);
    setTimerCondition('');
    setShowQuickCreate(false);
    setModalType('tracking');
    setTrackingLoading(true);
    const [listRes, empRes] = await Promise.all([
      trackingService.getByTask(task.idTask),
      trackingService.getEmployees(),
    ]);
    if (empRes.success) {
      const emps = empRes.data ?? empRes.Data ?? [];
      setTrackingEmployees(Array.isArray(emps) ? emps : []);
    }

    if (listRes.success) {
      const raw = listRes.data ?? listRes.Data ?? [];
      const items = Array.isArray(raw) ? raw : [];
      // Normalize every row so downstream code can use camelCase safely
      const normalizedItems = items.map(t => ({
        ...t,
        idTracking:       t.idTracking       ?? t.IdTracking,
        name:             t.name             ?? t.Name ?? t.tracking ?? t.Tracking ?? '—',
        startDateTime:    t.startDateTime    ?? t.StartDateTime,
        dueDateTime:      t.dueDateTime      ?? t.DueDateTime,
        durationTime:     t.durationTime     ?? t.DurationTime    ?? 0,
        timeWork:         t.timeWork         ?? t.TimeWork        ?? 0,
        trackingStar:     t.trackingStar     ?? t.TrackingStar    ?? null,
        idStatusTracking: t.idStatusTracking ?? t.IdStatusTracking ?? null,
        status:           t.status           ?? t.Status          ?? '',
      }));
      setTrackingList(normalizedItems);

      // AUTO-SELECT: if any tracking is currently Working, start the timer automatically
      const working = normalizedItems.find(t => {
        const s = (t.status || '').toLowerCase();
        return s.includes('work') || t.idStatusTracking === 55;
      });
      if (working) {
        const savedSeconds = working.timeWork ?? 0;
        const starRaw      = working.trackingStar ?? playTimestampsRef.current[working.idTracking] ?? null;
        const playedAtMs   = starRaw ? new Date(starRaw).getTime() : null;

        setSelectedTracking(working);
        setTimerVisible(true);
        setTimerCondition('Working');
        setActiveTrackingId(working.idTracking);
        // timerOffsetRef = accumulated seconds (same model as handleSelectTracking)
        timerOffsetRef.current = savedSeconds;

        if (playedAtMs && !isNaN(playedAtMs)) {
          // Timer = total accumulated: timeWork + elapsed since last Play
          timerStartEpochRef.current = playedAtMs;
          const initSec = savedSeconds + Math.floor((Date.now() - playedAtMs) / 1000);
          setTimerDisplay(initSec);
          timerIntervalRef.current = setInterval(() => {
            setTimerDisplay(savedSeconds + Math.floor((Date.now() - playedAtMs) / 1000));
          }, 1000);
        } else {
          // No TrackingStar: show accumulated, count up from there
          timerStartEpochRef.current = Date.now();
          setTimerDisplay(savedSeconds);
          timerIntervalRef.current = setInterval(() => {
            setTimerDisplay(savedSeconds + Math.floor((Date.now() - timerStartEpochRef.current) / 1000));
          }, 1000);
        }
      }
    }

    setTrackingLoading(false);
  }, []);

  const openQuickCreate = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setQuickCreateForm({
      name:          selectedTaskRow?.name || '',
      startDateTime: toLocal(now),
      dueDateTime:   toLocal(tomorrow),
      idEmployee:    trackingEmployees.length > 0 ? String(trackingEmployees[0].idEmployee) : '',
    });
    setShowQuickCreate(true);
  }, [selectedTaskRow, trackingEmployees]);

  const closeModal = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    timerStartEpochRef.current = null;
    timerOffsetRef.current     = 0;
    setActiveTrackingId(null);
    setTimerDisplay(0);
    setSelectedTracking(null);
    setTimerVisible(false);
    setTimerCondition('');
    setShowQuickCreate(false);
    setTrackingList([]);
    setTrackingMsg({ type: '', text: '' });
    setModalType(null);
    setTaskDetail(null);
    setSelectedTaskId(null);
    setSelectedTaskRow(null);
    setClientDetails(null);
    setChecklist([]);
    setNotifHistory([]);
    setDetailMsg({ type: '', text: '' });
    setShowDelConfirm(false);
    setTimeout(() => triggerBtnRef.current?.focus(), 50);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FORM CHANGE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'idGroup') {
      if (value) {
        const res = await taskService.getTypeTasksByGroup(parseInt(value, 10));
        if (res.success) { setTypeTasksFiltered(res.data); setGroupFiltered(true); }
        else             { setTypeTasksFiltered([]); setGroupFiltered(false); }
      } else {
        setTypeTasksFiltered([]);
        setGroupFiltered(false);
      }
      setFormData(prev => ({ ...prev, idGroup: value, idTypeTask: '', idStatus: '' }));
      setStatusList([]);
      setVisibility({ showApptWith: false, showDatePaid: false });
      return;
    }

    if (name === 'idTypeTask') {
      await loadStatusesForTypeTask(value);
      await loadVisibility(value);
      const tt = typeTasksList.find(t => t.idTypeTask === parseInt(value, 10));
      const n  = tt?.name?.toLowerCase() || '';
      const updates = { idStatus: '' };
      if (!n.includes('book')) updates.idClientAccount = '';
      if (modalType === 'create' && value && tt && n !== 'other' && n !== 'otros') {
        updates.name = tt.name;
      }
      setFormData(prev => ({ ...prev, ...updates }));
    }

    if (name === 'idClient') {
      await loadContactsAndAccounts(value);
      setFormData(prev => ({ ...prev, idContact: '', idClientAccount: '' }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MULTISELECT → FORMDATA SYNC
  // Called at the start of handleSave to push MS values into formData
  // idContact / idClientAccount come from formData directly (regular selects)
  // ─────────────────────────────────────────────────────────────────────────
  const buildMsSyncedData = (base) => {
    const empIds = msEmployee.map(x => x.value);
    return {
      ...base,
      idEmployee:     msEmployee[0]?.value || '',  // primary (first selected)
      participantIds: empIds,                       // all assigned employees become participants
      supervisorIds:  msSupervisors.map(x => x.value),
      appointmentIds: msApptWith.map(x => x.value),
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE (Create or Update)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const payload = buildMsSyncedData(formData);

    if (!payload.name?.trim())  { setDetailMsg({ type: 'error', text: 'Name is required' }); return; }
    if (!payload.idClient)      { setDetailMsg({ type: 'error', text: 'Client (Related To) is required' }); return; }
    if (!payload.idTypeTask)    { setDetailMsg({ type: 'error', text: 'Type Task is required' }); return; }
    if (!payload.idEmployee)    { setDetailMsg({ type: 'error', text: 'Assigned To is required' }); return; }
    if (!payload.idStatus)      { setDetailMsg({ type: 'error', text: 'Status is required' }); return; }
    if (!payload.idLocation)    { setDetailMsg({ type: 'error', text: 'Location is required' }); return; }
    if (!payload.fiscalYear)    { setDetailMsg({ type: 'error', text: 'Calendar Year is required' }); return; }

    setSaving(true);
    setDetailMsg({ type: '', text: '' });

    if (modalType === 'create') {
      const res = await taskService.create(payload);
      if (res.success) {
        closeModal();
        showSuccess('Task created successfully', setListMsg);
        await handleRefresh();
      } else {
        setDetailMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = await taskService.update(selectedTaskId, payload);
      if (res.success) {
        showSuccess('Task updated successfully', setDetailMsg);
        await handleRefresh();
        const dr = await taskService.getById(selectedTaskId);
        if (dr.success) setTaskDetail(dr.data);
      } else {
        setDetailMsg({ type: 'error', text: res.message });
      }
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    const res = await taskService.delete(selectedTaskId);
    if (res.success) {
      closeModal();
      showSuccess('Task deleted', setListMsg);
      await handleRefresh();
    } else {
      setDetailMsg({ type: 'error', text: res.message });
    }
    setDeleting(false);
    setShowDelConfirm(false);
  };

  const handleDeleteRow = async (taskId) => {
    setDeleting(true);
    const res = await taskService.delete(taskId);
    if (res.success) {
      setDeleteConfirmRow(null);
      showSuccess('Task deleted', setListMsg);
      await handleRefresh();
    } else {
      setListMsg({ type: 'error', text: res.message });
    }
    setDeleting(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  const elapsedMinutes = () => {
    if (!timerStartEpochRef.current) return 0;
    return Math.floor((Date.now() - timerStartEpochRef.current) / 60000);
  };

  const handleQuickCreateSave = async () => {
    if (!quickCreateForm.name.trim()) return;
    setSavingQuickCreate(true);

    const payload = {
      idTask:           selectedTaskId,
      name:             quickCreateForm.name.trim(),
      startDateTime:    quickCreateForm.startDateTime || null,
      dueDateTime:      quickCreateForm.dueDateTime   || null,
      idEmployee:       quickCreateForm.idEmployee ? parseInt(quickCreateForm.idEmployee, 10) : null,
      idStatusTracking: 54,
    };

    const res = await trackingService.create(payload);
    setSavingQuickCreate(false);

    if (res.success) {
      setShowQuickCreate(false);
      setTrackingMsg({ type: 'success', text: 'Tracking entry created.' });
      setTimeout(() => setTrackingMsg({ type: '', text: '' }), 3500);
      await loadTrackings(selectedTaskId);
    } else {
      setTrackingMsg({ type: 'error', text: res.message || 'Error creating tracking.' });
    }
  };

  const handleSelectTracking = (trk) => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    timerStartEpochRef.current = null;

    const normalized = {
      idTracking:       trk.idTracking       ?? trk.IdTracking,
      name:             trk.name             ?? trk.Name ?? trk.tracking ?? trk.Tracking ?? '—',
      startDateTime:    trk.startDateTime    ?? trk.StartDateTime,
      dueDateTime:      trk.dueDateTime      ?? trk.DueDateTime,
      durationTime:     trk.durationTime     ?? trk.DurationTime    ?? 0,
      timeWork:         trk.timeWork         ?? trk.TimeWork        ?? 0,
      trackingStar:     trk.trackingStar     ?? trk.TrackingStar    ?? null,
      idStatusTracking: trk.idStatusTracking ?? trk.IdStatusTracking ?? null,
      status:           trk.status           ?? trk.Status          ?? '—',
    };

    const s = normalized.status.toLowerCase();
    const isWorking = s.includes('work') || normalized.idStatusTracking === 55;

    // Accumulated seconds from all completed sessions (used as timer offset)
    const lsEntry            = lsGetEntry(normalized.idTracking);
    const savedPauseSeconds  = pauseSecondsRef.current[normalized.idTracking] ?? null;
    const prevSessionSeconds =
      savedPauseSeconds
      ?? (isWorking ? lsEntry?.offsetSeconds ?? normalized.timeWork : normalized.timeWork);

    // Best play-timestamp for restoring a running timer
    const trackingStarRaw =
      normalized.trackingStar
      ?? playTimestampsRef.current[normalized.idTracking]
      ?? lsEntry?.playedAt
      ?? null;

    if (isWorking && trackingStarRaw) {
      const playedAtMs = new Date(trackingStarRaw).getTime();
      timerStartEpochRef.current = playedAtMs;
      timerOffsetRef.current     = prevSessionSeconds;
      const initialSeconds = prevSessionSeconds + Math.floor((Date.now() - playedAtMs) / 1000);
      setTimerDisplay(initialSeconds);
      setActiveTrackingId(normalized.idTracking);
      timerIntervalRef.current = setInterval(() => {
        setTimerDisplay(prevSessionSeconds + Math.floor((Date.now() - playedAtMs) / 1000));
      }, 1000);
    } else {
      // Paused, Completed, or Working without a timestamp — show accumulated, frozen
      timerOffsetRef.current = prevSessionSeconds;
      setTimerDisplay(prevSessionSeconds);
      setActiveTrackingId(null);
    }

    setSelectedTracking(normalized);
    setTimerVisible(true);
    setTimerCondition(s.includes('comp') ? 'Completed' : isWorking ? 'Working' : 'Paused');
  };

  const handlePlay = async () => {
    if (!selectedTracking) return;
    const trkId = selectedTracking.idTracking;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const res = await trackingService.play(trkId);
    if (!res.success) { setTrackingMsg({ type: 'error', text: res.message }); return; }
    // Capture offset (= accumulated seconds so far) before starting new session
    const offset = timerOffsetRef.current;
    timerStartEpochRef.current = Date.now();
    setActiveTrackingId(trkId);
    setTimerCondition('Working');
    setSelectedTracking(prev => prev ? { ...prev, status: 'Working', idStatusTracking: 55 } : prev);
    const playedAt = new Date().toISOString();
    playTimestampsRef.current[trkId] = playedAt;
    lsSaveEntry(trkId, playedAt, offset);   // persist so browser-close can restore
    delete pauseSecondsRef.current[trkId];
    setTrackingList(prev => prev.map(t =>
      (t.idTracking ?? t.IdTracking) === trkId
        ? { ...t, idStatusTracking: 55, status: 'Working', trackingStar: playedAt }
        : t
    ));
    // Timer shows total: accumulated offset + elapsed since this Play
    timerIntervalRef.current = setInterval(() => {
      setTimerDisplay(offset + Math.floor((Date.now() - timerStartEpochRef.current) / 1000));
    }, 1000);
  };

  const handlePause = async () => {
    if (!selectedTracking) return;
    const trkId        = selectedTracking.idTracking;
    const snapshot     = timerDisplay;                          // total seconds (offset + elapsed)
    const deltaSeconds = snapshot - timerOffsetRef.current;    // seconds worked this session only
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    const res = await trackingService.pause(trkId, deltaSeconds);
    if (!res.success) { setTrackingMsg({ type: 'error', text: res.message }); return; }
    timerStartEpochRef.current = null;
    timerOffsetRef.current     = snapshot;   // snapshot IS the new timeWork total
    pauseSecondsRef.current[trkId] = snapshot;
    delete playTimestampsRef.current[trkId];
    lsClearEntry(trkId);
    setActiveTrackingId(null);
    // Keep timerDisplay at snapshot so the frozen value is visible after pause
    setTimerCondition('Paused');
    // snapshot = DB_TimeWork + deltaSeconds = new accumulated total
    setSelectedTracking(prev => prev ? { ...prev, status: 'Paused', idStatusTracking: 54, timeWork: snapshot } : prev);
    setTrackingList(prev => prev.map(t =>
      (t.idTracking ?? t.IdTracking) === trkId
        ? { ...t, status: 'Paused', idStatusTracking: 54, timeWork: snapshot }
        : t
    ));
    await loadTrackings(selectedTaskId);
  };

  const handleStop = async () => {
    if (!selectedTracking) return;
    if (!window.confirm('¿Do you want to finish tracking the task?')) return;
    const trkId        = selectedTracking.idTracking;
    const snapshot     = timerDisplay;
    const deltaSeconds = snapshot - timerOffsetRef.current;   // seconds worked this session only
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    const res = await trackingService.stop(trkId, deltaSeconds);
    if (!res.success) { setTrackingMsg({ type: 'error', text: res.message }); return; }
    timerStartEpochRef.current = null;
    timerOffsetRef.current     = 0;
    delete playTimestampsRef.current[trkId];
    delete pauseSecondsRef.current[trkId];
    lsClearEntry(trkId);
    setActiveTrackingId(null);
    setTimerDisplay(0);
    setTimerCondition('Completed');
    setTimerVisible(false);
    setSelectedTracking(null);
    await loadTrackings(selectedTaskId);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSavingComment(true);
    const res = await taskService.addComment(selectedTaskId, newComment.trim());
    if (res.success) {
      setNewComment('');
      const dr = await taskService.getById(selectedTaskId);
      if (dr.success) setTaskDetail(dr.data);
    } else {
      setDetailMsg({ type: 'error', text: res.message });
    }
    setSavingComment(false);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    const res = await taskService.updateComment(selectedTaskId, commentId, editCommentText.trim());
    if (res.success) {
      setEditingComment(null);
      const dr = await taskService.getById(selectedTaskId);
      if (dr.success) setTaskDetail(dr.data);
    } else {
      setDetailMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await taskService.deleteComment(selectedTaskId, commentId);
    if (res.success) {
      const dr = await taskService.getById(selectedTaskId);
      if (dr.success) setTaskDetail(dr.data);
    } else {
      setDetailMsg({ type: 'error', text: res.message });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CHECKLIST
  // ─────────────────────────────────────────────────────────────────────────
  const loadChecklist = useCallback(async (taskId) => {
    setChecklistLoading(true);
    const res = await taskService.getChecklist(taskId);
    if (res.success) setChecklist(res.data);
    setChecklistLoading(false);
  }, []);

  const updateChecklistItemLocal = (itemId, changes) => {
    setChecklist(prev => prev.map(i =>
      i.idTaskDocumentCheckList === itemId ? { ...i, ...changes } : i
    ));
  };

  const handleCheckboxChange = async (item, checked) => {
    const statusId     = checked ? 221 : 218;
    const receivedDate = checked ? new Date().toISOString().slice(0, 10) : null;
    const statusLabel  = checklistStatuses.find(s => s.idTabla === statusId)?.description || '';
    updateChecklistItemLocal(item.idTaskDocumentCheckList, {
      isChecked: checked, codStatus: statusId, status: statusLabel, receivedDate,
    });
    const res = await taskService.updateChecklistItem(selectedTaskId, item.idTaskDocumentCheckList, statusId, receivedDate);
    if (!res.success) {
      updateChecklistItemLocal(item.idTaskDocumentCheckList, {
        isChecked: item.isChecked, codStatus: item.codStatus, status: item.status, receivedDate: item.receivedDate,
      });
      setDetailMsg({ type: 'error', text: res.message });
    }
  };

  const handleChecklistStatusChange = async (item, newStatusId) => {
    const statusId     = parseInt(newStatusId, 10);
    const receivedDate = statusId === 221 ? new Date().toISOString().slice(0, 10) : item.receivedDate || null;
    const isChecked    = statusId === 221 || statusId === 222;
    const statusLabel  = checklistStatuses.find(s => s.idTabla === statusId)?.description || '';
    updateChecklistItemLocal(item.idTaskDocumentCheckList, {
      codStatus: statusId, status: statusLabel, isChecked, receivedDate,
    });
    const res = await taskService.updateChecklistItem(selectedTaskId, item.idTaskDocumentCheckList, statusId, receivedDate);
    if (!res.success) {
      updateChecklistItemLocal(item.idTaskDocumentCheckList, {
        codStatus: item.codStatus, status: item.status, isChecked: item.isChecked, receivedDate: item.receivedDate,
      });
      setDetailMsg({ type: 'error', text: res.message });
    }
  };

  const handleNotesBlur = async (item, notes) => {
    if (notes === (item.notes || '')) return;
    // Pass current status/receivedDate unchanged, plus the new notes
    const res = await taskService.updateChecklistItem(
      selectedTaskId, item.idTaskDocumentCheckList,
      item.codStatus, item.receivedDate || null, notes
    );
    if (!res.success) setDetailMsg({ type: 'error', text: res.message });
  };

  const handleNotificationToggle = (itemId) => {
    setChecklist(prev => prev.map(item =>
      item.idTaskDocumentCheckList === itemId
        ? { ...item, notification: !isNotificationChecked(item.notification) }
        : item
    ));
  };

  const handleSendNotification = async () => {
    const notifyIds = checklist
      .filter(item => isNotificationChecked(item.notification))
      .map(item => item.idTaskDocumentCheckList);
    if (notifyIds.length === 0) {
      setDetailMsg({ type: 'error', text: 'No documents selected for notification. Check the Notify column.' });
      return;
    }
    setSendingNotification(true);
    const res = await taskService.sendNotification(selectedTaskId, notifyIds);
    if (res.success) {
      showSuccess('Notification sent successfully', setDetailMsg);
      await loadChecklist(selectedTaskId);
      await loadNotifHistory(selectedTaskId);
    } else {
      setDetailMsg({ type: 'error', text: res.message });
    }
    setSendingNotification(false);
  };

  const handleSendSMS = () => {
    setDetailMsg({ type: 'error', text: 'SMS notification requires additional backend configuration. Contact your system administrator.' });
  };

  // Normalize Notification field — API returns string? (null/"True"/"False"/"1"/"0")
  const isNotificationChecked = (val) =>
    val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true';

  const getChecklistRowClass = (item) => {
    if (item.status === 'Not Applicable') return 'tsk-cl-row-orange';
    if (item.isChecked || item.status === 'Delivered') return 'tsk-cl-row-green';
    return 'tsk-cl-row-yellow';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATION HISTORY + SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  const loadNotifHistory = useCallback(async (taskId) => {
    setNotifLoading(true);
    const res = await taskService.getNotificationHistory(taskId);
    if (res.success) setNotifHistory(res.data);
    setNotifLoading(false);
  }, []);

  const loadNotifSettings = useCallback(async (taskId) => {
    setNotifSettingsLoading(true);
    const [dmR, frR, cnR, stR] = await Promise.all([
      taskService.getNotificationSettingCatalog('DeliveryMethod'),
      taskService.getNotificationSettingCatalog('FrequencyDelivery'),
      taskService.getNotificationSettingCatalog('ConditionsNotification'),
      taskService.getNotificationSettings(taskId),
    ]);
    setNotifCatalogs({
      deliveryMethods: dmR.success ? dmR.data : [],
      frequencies:     frR.success ? frR.data : [],
      conditions:      cnR.success ? cnR.data : [],
    });
    if (stR.success && stR.data) {
      setNotifSettings({
        deliveryMethod:         stR.data.deliveryMethod          || '',
        frequencyDelivery:      stR.data.frequencyDelivery        || '',
        deliveryDate:           stR.data.deliveryDate
                                  ? stR.data.deliveryDate.slice(0, 10)
                                  : '',
        conditionsNotification: stR.data.conditionsNotification  || '',
      });
    }
    setNotifSettingsLoading(false);
  }, []);

  const handleNotifSettingChange = async (tipo, value) => {
    setNotifSettings(prev => {
      const key = {
        DeliveryMethod:         'deliveryMethod',
        FrequencyDelivery:      'frequencyDelivery',
        NotificationDate:       'deliveryDate',
        ConditionsNotification: 'conditionsNotification',
      }[tipo];
      return key ? { ...prev, [key]: value } : prev;
    });
    // If frequency changes away from Personalized, clear the date
    if (tipo === 'FrequencyDelivery') {
      const label = notifCatalogs.frequencies.find(f => String(f.idTabla) === String(value))?.description || '';
      if (label !== 'Personalized') {
        await taskService.updateNotificationSetting(selectedTaskId, 'NotificationDate', null);
        setNotifSettings(prev => ({ ...prev, deliveryDate: '' }));
      }
    }
    await taskService.updateNotificationSetting(selectedTaskId, tipo, value || null);
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'checklist' && checklist.length === 0 && selectedTaskId) {
      await loadChecklist(selectedTaskId);
    }
    if (tab === 'notifications' && notifHistory.length === 0 && selectedTaskId) {
      await loadNotifHistory(selectedTaskId);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const renderMsg = (msg, setMsg) => {
    if (!msg.text) return null;
    return (
      <div className={`tsk-alert tsk-alert-${msg.type}`} role="alert">
        <span>{msg.text}</span>
        <button className="tsk-alert-close" onClick={() => setMsg({ type: '', text: '' })} aria-label="Dismiss">×</button>
      </div>
    );
  };

  const renderFormField = (label, name, type = 'text', required = false) => (
    <div className="tsk-field">
      <label className="tsk-label">{label}{required && <span className="tsk-required">*</span>}</label>
      <input type={type} name={name} value={formData[name] || ''} onChange={handleChange} className="tsk-input" />
    </div>
  );

  const renderSelect = (label, name, options, valueKey, labelKey, required = false) => (
    <div className="tsk-field">
      <label className="tsk-label">{label}{required && <span className="tsk-required">*</span>}</label>
      <select name={name} value={formData[name] || ''} onChange={handleChange} className="tsk-select">
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={o[valueKey]} value={o[valueKey]}>{o[labelKey]}</option>
        ))}
      </select>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TASK FORM — matches M_Tasks.aspx field order exactly
  // ─────────────────────────────────────────────────────────────────────────
  const renderTaskForm = () => {
    const isOther    = isOtherTypeTask(formData.idTypeTask);
    const isBooking  = isBookingTypeTask(formData.idTypeTask);
    const shownTypes = groupFiltered ? typeTasksFiltered : typeTasksList;

    return (
      <div className="tsk-form-2col">

        {/* ── ROW 1: Task Number + Group ─────────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Task Number:</label>
            <input
              type="text"
              value={modalType === 'edit' && taskDetail ? taskDetail.idTask : ''}
              placeholder="Auto-generated"
              className="tsk-input tsk-input-readonly"
              readOnly
            />
          </div>
          <div className="tsk-field">
            <label className="tsk-label">Group:</label>
            <select name="idGroup" value={formData.idGroup || ''} onChange={handleChange} className="tsk-select">
              <option value="">— Select —</option>
              {groups.map(g => <option key={g.idGroup} value={g.idGroup}>{g.nameGroup}</option>)}
            </select>
          </div>
        </div>

        {/* ── ROW 2: Type Task + Name ─────────────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Type Task <span className="tsk-required">*</span></label>
            <select name="idTypeTask" value={formData.idTypeTask || ''} onChange={handleChange} className="tsk-select">
              <option value="">— Select —</option>
              {shownTypes.map(t => <option key={t.idTypeTask} value={t.idTypeTask}>{t.name}</option>)}
            </select>
          </div>
          <div className="tsk-field">
            <label className="tsk-label">
              Name <span className="tsk-required">*</span>
              {!isOther && formData.idTypeTask && <span className="tsk-label-hint"> — auto</span>}
            </label>
            <input
              type="text" name="name" value={formData.name} onChange={handleChange}
              className={`tsk-input${(!isOther && formData.idTypeTask) ? ' tsk-input-readonly' : ''}`}
              readOnly={!isOther && !!formData.idTypeTask}
              maxLength={150} placeholder="Task name..."
            />
          </div>
        </div>

        {/* ── ROW 3: Start Date + Due Date ────────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Start Date &amp; Time <span className="tsk-required">*</span></label>
            <input type="datetime-local" name="startDateTime"
              value={formData.startDateTime || ''} onChange={handleChange} className="tsk-input" />
          </div>
          <div className="tsk-field">
            <label className="tsk-label">Due Date &amp; Time <span className="tsk-required">*</span></label>
            <input type="datetime-local" name="dueDateTime"
              value={formData.dueDateTime || ''} onChange={handleChange} className="tsk-input" />
          </div>
        </div>

        {/* ── ROW 4: Estimate + Assigned To ───────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">
              Estimate <span className="tsk-required">*</span>
              <span className="tsk-label-hint"> (2d 2h 30m)</span>
            </label>
            <div className="tsk-form-row-estimate">
              <div className="tsk-estimate-group">
                <input type="number" name="dia" value={formData.dia ?? ''} onChange={handleChange}
                  className="tsk-input tsk-input-estimate" min={0} placeholder="0" />
                <span className="tsk-estimate-label">DAYS</span>
              </div>
              <div className="tsk-estimate-group">
                <input type="number" name="horas" value={formData.horas ?? ''} onChange={handleChange}
                  className="tsk-input tsk-input-estimate" min={0} max={23} placeholder="0" />
                <span className="tsk-estimate-label">HRS</span>
              </div>
              <div className="tsk-estimate-group">
                <input type="number" name="minutos" value={formData.minutos ?? ''} onChange={handleChange}
                  className="tsk-input tsk-input-estimate" min={0} max={59} placeholder="0" />
                <span className="tsk-estimate-label">MIN</span>
              </div>
            </div>
          </div>
          <div className="tsk-field">
            <label className="tsk-label">Assigned To <span className="tsk-required">*</span></label>
            <MultiSelect
              options={employeeOptions}
              value={msEmployee}
              onChange={setMsEmployee}
              placeholder="Select employee..."
              isMulti={true}
            />
          </div>
        </div>

        {/* ── ROW 5: Status + Location ─────────────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Status <span className="tsk-required">*</span></label>
            <select name="idStatus" value={formData.idStatus || ''} onChange={handleChange} className="tsk-select">
              <option value="">— Select —</option>
              {statusList.map(s => <option key={s.idTabla} value={s.idTabla}>{s.description}</option>)}
            </select>
          </div>
          <div className="tsk-field">
            <label className="tsk-label">Location <span className="tsk-required">*</span></label>
            <select name="idLocation" value={formData.idLocation || ''} onChange={handleChange} className="tsk-select">
              <option value="">— Select —</option>
              {locations.map(l => <option key={l.idTabla} value={l.idTabla}>{l.description}</option>)}
            </select>
          </div>
        </div>

        {/* ── CONDITIONAL: Policy Exp + Date Paid ─────────── */}
        {visibility.showDatePaid && (
          <div className="tsk-form-row">
            <div className="tsk-field">
              <label className="tsk-label">Policy Exp. Date</label>
              <input type="datetime-local" name="policyExpDate"
                value={formData.policyExpDate || ''} onChange={handleChange} className="tsk-input" />
            </div>
            <div className="tsk-field">
              <label className="tsk-label">Date Paid</label>
              <input type="datetime-local" name="datePaid"
                value={formData.datePaid || ''} onChange={handleChange} className="tsk-input" />
            </div>
          </div>
        )}

        {/* ── ROW 6: Related To + Calendar Year ──────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Related To <span className="tsk-required">*</span></label>
            <div className="tsk-related-to-row">
              <span className="tsk-related-to-type">Client</span>
              <select name="idClient" value={formData.idClient || ''} onChange={handleChange} className="tsk-select">
                <option value="">— Select —</option>
                {clients.map(c => <option key={c.idClient} value={c.idClient}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="tsk-field">
            <label className="tsk-label">Calendar Year <span className="tsk-required">*</span></label>
            <select name="fiscalYear" value={formData.fiscalYear || ''} onChange={handleChange} className="tsk-select">
              <option value="">— Select —</option>
              {fiscalYears.map(f => <option key={f.idTabla} value={f.idTabla}>{f.description}</option>)}
            </select>
          </div>
        </div>

        {/* ── ROW 7: Contact Name ──────────────────────────── */}
        <div className="tsk-form-row">
          <div className="tsk-field">
            <label className="tsk-label">Contact Name</label>
            <select name="idContact" value={formData.idContact || ''} onChange={handleChange}
              className="tsk-select" disabled={!formData.idClient}>
              <option value="">— Select —</option>
              {contacts.map(c => <option key={c.idContact} value={c.idContact}>{c.firstName}</option>)}
            </select>
          </div>
          <div className="tsk-field" />
        </div>

        {/* ── ROW 8: Client Account (conditional booking) ───── */}
        {isBooking && (
          <div className="tsk-form-row">
            <div className="tsk-field">
              <label className="tsk-label">Client Account <span className="tsk-required">*</span></label>
              <select name="idClientAccount" value={formData.idClientAccount || ''} onChange={handleChange}
                className="tsk-select">
                <option value="">— Select —</option>
                {clientAccounts.map(a => <option key={a.idClientAccount} value={a.idClientAccount}>{a.clienteAccount}</option>)}
              </select>
            </div>
            <div className="tsk-field" />
          </div>
        )}

        {/* ── CONDITIONAL: Parent Task (edit + has parent) ─── */}
        {modalType === 'edit' && formData.idParentTask && (
          <div className="tsk-form-row tsk-form-row-full">
            <div className="tsk-field">
              <label className="tsk-label">Parent Task</label>
              <input
                type="text"
                value={formData.parentTaskName
                  ? `#${formData.idParentTask} — ${formData.parentTaskName}`
                  : `Task #${formData.idParentTask}`}
                className="tsk-input tsk-input-readonly"
                readOnly
              />
            </div>
          </div>
        )}

        {/* ── ROW 8: Task Supervisor + Appt With (conditional) */}
        {visibility.showApptWith && (
          <div className="tsk-form-row">
            <div className="tsk-field">
              <label className="tsk-label">Task Supervisor <span className="tsk-required">*</span></label>
              <MultiSelect
                options={employeeOptions}
                value={msSupervisors}
                onChange={setMsSupervisors}
                placeholder="Select supervisor..."
                isMulti={true}
              />
            </div>
            <div className="tsk-field">
              <label className="tsk-label">Appt with</label>
              <MultiSelect
                options={employeeOptions}
                value={msApptWith}
                onChange={setMsApptWith}
                placeholder="Select..."
                isMulti={true}
              />
            </div>
          </div>
        )}

        {/* ── ROW 9: Description — full width ─────────────── */}
        <div className="tsk-form-row tsk-form-row-full">
          <div className="tsk-field">
            <label className="tsk-label">Description <span className="tsk-required">*</span></label>
            <textarea
              name="description" value={formData.description || ''} onChange={handleChange}
              className="tsk-textarea" rows={4} maxLength={500}
              placeholder="Description..."
            />
            <span className="tsk-char-count">
              {(formData.description || '').length}/500
            </span>
          </div>
        </div>

        {/* ── ROW 10: Active checkbox ──────────────────────── */}
        <div>
          <label className="tsk-checkbox-label tsk-checkbox-label-lg">
            <input type="checkbox" name="isActive" checked={formData.isActive}
              onChange={handleChange} className="tsk-checkbox" />
            <span>Active</span>
          </label>
        </div>

      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: COMMENTS TAB
  // ─────────────────────────────────────────────────────────────────────────
  const renderCommentsSection = () => {
    const comments = taskDetail?.comments || [];
    return (
      <div className="tsk-comments-section">
        <div className="tsk-comments-section-header">
          <i className="fas fa-comments" /> Comments
          <span className="tsk-comments-count">{comments.length}</span>
        </div>
        <div className="tsk-comments-list">
          {comments.length === 0
            ? <p className="tsk-empty-note">No comments yet.</p>
            : comments.map(c => (
                <div key={c.idComment} className="tsk-comment-item">
                  <div className="tsk-comment-meta">
                    <span className="tsk-comment-author">{c.employeeName || 'System'}</span>
                    <div className="tsk-comment-actions">
                      <span className="tsk-comment-date">{fmtDateTime(c.commentDate)}</span>
                      <button className="tsk-comment-btn" aria-label="Edit comment"
                        onClick={() => { setEditingComment(c.idComment); setEditCommentText(c.comment); }}>
                        <i className="fas fa-pencil-alt" />
                      </button>
                      <button className="tsk-comment-btn tsk-comment-btn-danger" aria-label="Delete comment"
                        onClick={() => handleDeleteComment(c.idComment)}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                  {editingComment === c.idComment
                    ? (
                      <div className="tsk-comment-edit">
                        <textarea className="tsk-input" rows={2} value={editCommentText}
                          onChange={e => setEditCommentText(e.target.value)} />
                        <div className="tsk-comment-edit-btns">
                          <button className="tsk-btn tsk-btn-primary tsk-btn-sm" onClick={() => handleUpdateComment(c.idComment)}>Save</button>
                          <button className="tsk-btn tsk-btn-ghost tsk-btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                        </div>
                      </div>
                    )
                    : <p className="tsk-comment-text">{c.comment}</p>
                  }
                </div>
              ))
          }
        </div>
        <div className="tsk-add-comment">
          <textarea className="tsk-input" rows={2} placeholder="Write a new comment..."
            value={newComment} onChange={e => setNewComment(e.target.value)} />
          <button className="tsk-btn tsk-btn-primary" onClick={handleAddComment}
            disabled={savingComment || !newComment.trim()}>
            {savingComment ? 'Saving...' : 'Add Comment'}
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: CHECKLIST TAB
  // ─────────────────────────────────────────────────────────────────────────
  const renderChecklistTab = () => (
    <div className="tsk-tab-content">
      <div className="tsk-checklist-toolbar">
        <button className="tsk-btn tsk-btn-outline" onClick={handleSendSMS} disabled={sendingNotification}>
          <i className="fas fa-comment-sms" />
          {' Notify by SMS'}
        </button>
        <button className="tsk-btn tsk-btn-primary" onClick={handleSendNotification} disabled={sendingNotification}>
          <i className="fas fa-envelope" />
          {sendingNotification ? ' Sending...' : ' Notify by Email'}
        </button>
      </div>
      {checklistLoading
        ? <div className="tsk-loading-sm"><div className="tsk-spinner" /></div>
        : checklist.length === 0
          ? <p className="tsk-empty-note">No documents in the checklist.</p>
          : (
            <div className="tsk-table-wrap">
              <table className="tsk-table tsk-cl-table">
                <thead>
                  <tr>
                    <th className="tsk-cl-th-center">Check</th>
                    <th>Document Name</th>
                    <th>Date Received</th>
                    <th>Status</th>
                    <th>User</th>
                    <th>Notes / Comments</th>
                    <th className="tsk-cl-th-center">Notify</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.map(item => (
                    <tr key={item.idTaskDocumentCheckList} className={getChecklistRowClass(item)}>
                      <td className="tsk-cl-td-center">
                        <input type="checkbox" className="tsk-cl-checkbox"
                          checked={!!item.isChecked}
                          onChange={e => handleCheckboxChange(item, e.target.checked)} />
                      </td>
                      <td>{item.documentName}</td>
                      <td className="tsk-cl-td-nowrap">{item.receivedDate ? fmtInput(item.receivedDate) : '—'}</td>
                      <td>
                        <select className="tsk-select tsk-select-sm" value={item.codStatus || ''}
                          onChange={e => handleChecklistStatusChange(item, e.target.value)}>
                          {checklistStatuses.map(s => (
                            <option key={s.idTabla} value={s.idTabla}>{s.description}</option>
                          ))}
                        </select>
                      </td>
                      <td className="tsk-cl-td-user">{item.user || '—'}</td>
                      <td>
                        {/* key includes notes so textarea remounts (resets) when data reloads */}
                        <textarea key={`notes-${item.idTaskDocumentCheckList}-${item.notes ?? ''}`}
                          className="tsk-cl-notes"
                          defaultValue={item.notes || ''}
                          onBlur={e => handleNotesBlur(item, e.target.value)}
                          rows={2} placeholder="Enter comments here" />
                      </td>
                      <td className="tsk-cl-td-center">
                        <input type="checkbox" className="tsk-cl-checkbox"
                          checked={isNotificationChecked(item.notification)}
                          onChange={() => handleNotificationToggle(item.idTaskDocumentCheckList)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: NOTIFICATIONS TAB
  // ─────────────────────────────────────────────────────────────────────────
  const isPersonalizedFreq = () => {
    const sel = notifCatalogs.frequencies.find(f => String(f.idTabla) === String(notifSettings.frequencyDelivery));
    return sel?.description === 'Personalized';
  };

  const renderNotificationsTab = () => (
    <div className="tsk-tab-content tsk-notif-tab">

      {/* ── 1. Notification History ─────────────────────────────────────── */}
      <div className="tsk-notif-section">
        <h5 className="tsk-notif-section-title">
          <i className="fas fa-history" /> Notification History
        </h5>
        {notifLoading
          ? <div className="tsk-loading-sm"><div className="tsk-spinner" /></div>
          : notifHistory.length === 0
            ? <p className="tsk-empty-note">No notification history for this task.</p>
            : (
              <div className="tsk-table-wrap">
                <table className="tsk-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Notification Method</th>
                      <th>Recipient</th>
                      <th>Delivery Status</th>
                      <th>Notification Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifHistory.map((n, i) => (
                      <tr key={i} className={n.estado === 'Error' ? 'tsk-row-error' : ''}>
                        <td className="tsk-notif-td-nowrap">{fmtDateTime(n.fechaHora)}</td>
                        <td>{n.metodoEnvio || '—'}</td>
                        <td>{n.destinatario || '—'}</td>
                        <td>
                          <span className={`tsk-badge ${n.estado === 'Error' ? 'tsk-badge-danger' : 'tsk-badge-success'}`}>
                            {n.estado || '—'}
                          </span>
                        </td>
                        <td>{n.descripcion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* ── 2. Notification Settings ────────────────────────────────────── */}
      <div className="tsk-notif-section">
        <h5 className="tsk-notif-section-title">
          <i className="fas fa-cog" /> Notification Settings
        </h5>
        {notifSettingsLoading
          ? <div className="tsk-loading-sm"><div className="tsk-spinner" /></div>
          : (
            <div className="tsk-notif-settings-grid">
              <div className="tsk-field">
                <label className="tsk-label">Default Delivery Method</label>
                <select className="tsk-select"
                  value={notifSettings.deliveryMethod}
                  onChange={e => handleNotifSettingChange('DeliveryMethod', e.target.value)}>
                  <option value="">— To Select —</option>
                  {notifCatalogs.deliveryMethods.map(o => (
                    <option key={o.idTabla} value={o.idTabla}>{o.description}</option>
                  ))}
                </select>
              </div>

              <div className="tsk-field">
                <label className="tsk-label">Notification Frequency</label>
                <select className="tsk-select"
                  value={notifSettings.frequencyDelivery}
                  onChange={e => handleNotifSettingChange('FrequencyDelivery', e.target.value)}>
                  <option value="">— To Select —</option>
                  {notifCatalogs.frequencies.map(o => (
                    <option key={o.idTabla} value={o.idTabla}>{o.description}</option>
                  ))}
                </select>
              </div>

              <div className="tsk-field">
                <label className="tsk-label">Next Notification Date</label>
                <input type="date" className="tsk-input"
                  value={notifSettings.deliveryDate}
                  disabled={!isPersonalizedFreq()}
                  onChange={e => {
                    setNotifSettings(prev => ({ ...prev, deliveryDate: e.target.value }));
                  }}
                  onBlur={e => handleNotifSettingChange('NotificationDate', e.target.value)} />
              </div>

              <div className="tsk-field">
                <label className="tsk-label">Notification Conditions</label>
                <select className="tsk-select"
                  value={notifSettings.conditionsNotification}
                  onChange={e => handleNotifSettingChange('ConditionsNotification', e.target.value)}>
                  <option value="">— To Select —</option>
                  {notifCatalogs.conditions.map(o => (
                    <option key={o.idTabla} value={o.idTabla}>{o.description}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        }
      </div>

      {/* ── 3. Manual Notification ──────────────────────────────────────── */}
      <div className="tsk-notif-section">
        <h5 className="tsk-notif-section-title">
          <i className="fas fa-paper-plane" /> Manual Notification
        </h5>
        <div className="tsk-notif-manual">
          <div className="tsk-field tsk-field-full">
            <label className="tsk-label">
              Notification Message
              <span className={`tsk-notif-char-count ${manualMessage.length >= 140 ? 'tsk-notif-char-warn' : ''}`}>
                {manualMessage.length}/160
              </span>
            </label>
            <textarea
              className="tsk-textarea"
              rows={3}
              maxLength={160}
              placeholder="Write your notification message here..."
              value={manualMessage}
              onChange={e => setManualMessage(e.target.value)}
            />
          </div>
          <div className="tsk-notif-manual-actions">
            <button
              className="tsk-btn tsk-btn-primary"
              disabled={!manualMessage.trim()}
              onClick={() => setDetailMsg({ type: 'error', text: 'SMS sending requires backend SMS gateway configuration. Contact your system administrator.' })}>
              <i className="fas fa-sms" /> Send Notification (SMS)
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="tsk-container">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — Search Panel
      ══════════════════════════════════════════════════════════════════ */}
      <div className="tsk-search-panel-card">

        {/* Panel header — always visible, click to collapse */}
        <div
          className="tsk-sp-header"
          onClick={() => {
            const next = !filterPanelOpen;
            setFilterPanelOpen(next);
            try { localStorage.setItem('tsk_panel_open', String(next)); } catch {}
          }}
          role="button"
          aria-expanded={filterPanelOpen}
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
        >
          <div className="tsk-sp-header-left">
            <i className="fas fa-filter tsk-sp-icon" />
            <span className="tsk-sp-title">Search Filters</span>
            {activeBadges.map(b => (
              <span key={b.key} className="tsk-filter-badge">
                {b.label}
                <button
                  className="tsk-filter-badge-rm"
                  aria-label={`Remove filter: ${b.label}`}
                  onClick={e => { e.stopPropagation(); removeBadge(b.key); }}
                >×</button>
              </span>
            ))}
          </div>
          <div className="tsk-sp-header-right">
            {lastUpdated && (
              <span className="tsk-sp-status">
                <i className="fas fa-clock" />{' '}
                {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                {' · '}{tasks.length} result{tasks.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="tsk-sp-toggle-btn" aria-hidden="true">
              <i className={`fas fa-chevron-${filterPanelOpen ? 'up' : 'down'}`} />
            </span>
          </div>
        </div>

        {/* Panel body — collapsible */}
        {filterPanelOpen && (
          <div className="tsk-sp-body">
            {renderMsg(listMsg, setListMsg)}
            {searchError && (
              <div className="tsk-alert tsk-alert-error" role="alert">
                <span>{searchError}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="tsk-btn tsk-btn-sm tsk-btn-ghost" onClick={handleRefresh} disabled={searching}>Retry</button>
                  <button className="tsk-alert-close" onClick={() => setSearchError(null)} aria-label="Dismiss">×</button>
                </div>
              </div>
            )}

            <div className={`tsk-sp-row${hasTaskNums ? ' tsk-sp-nums-active' : ''}`}>

              {/* Task # */}
              <div className="tsk-sp-field tsk-sp-field-nums">
                <label className="tsk-sp-label">Task #</label>
                <input
                  className={`tsk-input${taskNumError ? ' tsk-input-error' : ''}`}
                  placeholder="e.g. 123, 456"
                  aria-label="Task number"
                  value={filterTaskNums}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterTaskNums(val);
                    if (val.trim()) {
                      const parts = val.trim().split(/[\s,;]+/).filter(Boolean);
                      const invalid = parts.filter(p => !/^\d+$/.test(p));
                      setTaskNumError(invalid.length ? `Invalid: ${invalid.join(', ')}` : '');
                    } else {
                      setTaskNumError('');
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') { setFilterTaskNums(''); setTaskNumError(''); }
                  }}
                />
                {taskNumError && <span className="tsk-sp-field-error" role="alert">{taskNumError}</span>}
              </div>

              {/* Client autocomplete */}
              <div className="tsk-sp-field tsk-sp-field-client">
                <label className="tsk-sp-label">Client</label>
                <div className="tsk-autocomplete-wrap">
                  <input
                    type="text"
                    className="tsk-input"
                    placeholder="Search client..."
                    aria-label="Client name"
                    aria-autocomplete="list"
                    aria-expanded={showClientSuggestions && clientSuggestions.length > 0}
                    value={filterClientText}
                    onChange={e => {
                      setFilterClientText(e.target.value);
                      setFilterClientId(null);
                      setShowClientSuggestions(true);
                      // keep debouncedClientText in sync (used by activeBadges/removeBadge)
                      clearTimeout(debounceTimerRef.current);
                      debounceTimerRef.current = setTimeout(
                        () => setDebouncedClientText(e.target.value), 300
                      );
                    }}
                    onFocus={() => {
                      if (filterClientText.length >= 1) setShowClientSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!clientSuggestionMouseDown.current) setShowClientSuggestions(false);
                        clientSuggestionMouseDown.current = false;
                      }, 150);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setShowClientSuggestions(false); return; }
                      if (!showClientSuggestions || clientSuggestions.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIdx(i => Math.min(i + 1, clientSuggestions.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIdx(i => Math.max(i - 1, -1));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (highlightedIdx >= 0 && clientSuggestions[highlightedIdx]) {
                          handleClientSelect(clientSuggestions[highlightedIdx]);
                        }
                      }
                    }}
                    autoComplete="off"
                  />

                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="tsk-autocomplete-dropdown" role="listbox" aria-label="Client suggestions">
                      {clientSuggestions.map((c, idx) => (
                        <div
                          key={c.idClient}
                          role="option"
                          aria-selected={idx === highlightedIdx}
                          className={`tsk-autocomplete-item${idx === highlightedIdx ? ' tsk-autocomplete-highlighted' : ''}`}
                          onMouseDown={() => { clientSuggestionMouseDown.current = true; }}
                          onClick={() => handleClientSelect(c)}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {showClientSuggestions && filterClientText.length >= 1 && clientSuggestions.length === 0 && (
                    <div className="tsk-autocomplete-dropdown">
                      <div className="tsk-autocomplete-empty">
                        No clients found for &ldquo;{filterClientText}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Period */}
              <div className="tsk-sp-field tsk-sp-field-period">
                <label className="tsk-sp-label">Period</label>
                <select
                  className="tsk-select"
                  aria-label="Period"
                  value={filterPeriodId}
                  onChange={handlePeriodChange}
                  onKeyDown={e => { if (e.key === 'Escape') setFilterPeriodId(''); }}
                >
                  <option value="">— All periods —</option>
                  {periods.map(p => <option key={p.idTabla} value={p.idTabla}>{p.description}</option>)}
                </select>
              </div>

              {/* Date range */}
              <div className="tsk-sp-field tsk-sp-field-date">
                <label className="tsk-sp-label">From</label>
                <input
                  type="date"
                  className={`tsk-input${dateError ? ' tsk-input-error' : ''}`}
                  aria-label="Start date"
                  value={filterDateFrom}
                  onChange={e => {
                    setFilterDateFrom(e.target.value);
                    setDateError(e.target.value && filterDateTo && e.target.value > filterDateTo
                      ? 'Start date must be before end date' : '');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') { setFilterDateFrom(''); setDateError(''); }
                  }}
                />
              </div>
              <div className="tsk-sp-field tsk-sp-field-date">
                <label className="tsk-sp-label">To</label>
                <input
                  type="date"
                  className={`tsk-input${dateError ? ' tsk-input-error' : ''}`}
                  aria-label="End date"
                  value={filterDateTo}
                  onChange={e => {
                    setFilterDateTo(e.target.value);
                    setDateError(filterDateFrom && e.target.value && filterDateFrom > e.target.value
                      ? 'Start date must be before end date' : '');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') { setFilterDateTo(''); setDateError(''); }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="tsk-sp-actions">
                <button
                  className="tsk-btn tsk-btn-primary"
                  onClick={handleSearch}
                  disabled={searching || !!taskNumError || !!dateError}
                  aria-label="Search"
                >
                  <i className={`fas fa-${searching ? 'spinner fa-spin' : 'search'}`} />
                  {searching ? ' Searching...' : ' Search'}
                </button>
                <button className="tsk-btn tsk-btn-ghost" onClick={handleClearAll} aria-label="Clear all filters">
                  Clear
                </button>
                <button
                  className="tsk-btn tsk-btn-ghost tsk-btn-icon"
                  onClick={handleRefresh}
                  disabled={!lastSearch || searching}
                  aria-label="Refresh results"
                  title="Refresh"
                >
                  <i className="fas fa-sync-alt" />
                </button>
              </div>
            </div>

            {dateError && (
              <p className="tsk-sp-date-error" role="alert">
                <i className="fas fa-exclamation-circle" /> {dateError}
              </p>
            )}
            {showNumWarning && (
              <p className="tsk-filter-priority-note" role="status">
                <i className="fas fa-info-circle" /> Searching by task # — other filters ignored
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Results Panel
      ══════════════════════════════════════════════════════════════════ */}
      <div className="tsk-results-panel-card">

        {/* Results header */}
        <div className="tsk-rp-header">
          <div className="tsk-rp-header-left">
            {tasks.length > 0 && (
              <>
                <span className="tsk-rp-count">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                  {hasColFilters && tasks.length !== filteredTasks.length && ` of ${tasks.length}`}
                </span>
                {hasColFilters && (
                  <button className="tsk-link-btn tsk-rp-clear-col" onClick={clearColFilters}>
                    <i className="fas fa-times-circle" /> Clear column filters
                  </button>
                )}
              </>
            )}
          </div>
          <div className="tsk-rp-header-right">
            {tasks.length > 0 && (
              <div className="tsk-rp-rows-per-page">
                <label htmlFor="tsk-rpp">Rows:</label>
                <select
                  id="tsk-rpp"
                  className="tsk-select tsk-select-sm"
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
            <button className="tsk-btn tsk-btn-primary" onClick={openCreate} aria-label="New Task">
              <i className="fas fa-plus" /> New Task
            </button>
          </div>
        </div>

        {/* Table area */}
        {loading && tasks.length === 0 ? (
          /* Initial skeleton — no previous results */
          <div className="tsk-table-wrap">
            <table className="tsk-table" role="grid" aria-busy="true" aria-label="Loading tasks">
              <thead>
                <tr>
                  <th># Task</th><th>Name</th><th>Client</th><th>Type</th>
                  <th>Status</th><th>Priority</th><th>Assigned</th>
                  <th>Cal. Year</th><th>Account</th><th>Start</th><th>Due</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="tsk-skeleton-row">
                    {Array.from({ length: 12 }).map((__, j) => (
                      <td key={j}><div className="tsk-skeleton-cell" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tasks.length === 0 ? (
          <div className="tsk-empty-state">
            <i className="fas fa-search" />
            <p>
              {lastSearch
                ? `No tasks found for ${describeSearch(lastSearch.mode, lastSearch.params, lastSearch.clientText)}`
                : 'Use the filters above to search for tasks'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="tsk-table-wrap">
              <table className="tsk-table" role="grid" aria-busy={loading}>
                <thead>
                  <tr>
                    <th>
                      <div># Task</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by task number"
                        value={colFilter.idTask || ''} onChange={e => updateColFilter('idTask', e.target.value)} />
                    </th>
                    <th>
                      <div>Name</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by name"
                        value={colFilter.name || ''} onChange={e => updateColFilter('name', e.target.value)} />
                    </th>
                    <th>
                      <div>Client</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by client"
                        value={colFilter.clientName || ''} onChange={e => updateColFilter('clientName', e.target.value)} />
                    </th>
                    <th>
                      <div>Type</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by type"
                        value={colFilter.typeTask || ''} onChange={e => updateColFilter('typeTask', e.target.value)} />
                    </th>
                    <th>
                      <div>Status</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by status"
                        value={colFilter.statusName || ''} onChange={e => updateColFilter('statusName', e.target.value)} />
                    </th>
                    <th>
                      <div>Priority</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by priority"
                        value={colFilter.priorityName || ''} onChange={e => updateColFilter('priorityName', e.target.value)} />
                    </th>
                    <th>
                      <div>Assigned</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by assigned"
                        value={colFilter.assignedTo || ''} onChange={e => updateColFilter('assignedTo', e.target.value)} />
                    </th>
                    <th>
                      <div>Cal. Year</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by fiscal year"
                        value={colFilter.fiscalYear || ''} onChange={e => updateColFilter('fiscalYear', e.target.value)} />
                    </th>
                    <th>
                      <div>Account</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by account"
                        value={colFilter.clientAccount || ''} onChange={e => updateColFilter('clientAccount', e.target.value)} />
                    </th>
                    <th>
                      <div>Start</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by start date"
                        value={colFilter.startDateTime || ''} onChange={e => updateColFilter('startDateTime', e.target.value)} />
                    </th>
                    <th>
                      <div>Due</div>
                      <input className="tsk-col-filter" placeholder="Filter" aria-label="Filter by due date"
                        value={colFilter.dueDateTime || ''} onChange={e => updateColFilter('dueDateTime', e.target.value)} />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    /* Refresh skeleton — keep table visible */
                    Array.from({ length: Math.min(rowsPerPage, 8) }).map((_, i) => (
                      <tr key={`sk-${i}`} className="tsk-skeleton-row">
                        {Array.from({ length: 12 }).map((__, j) => (
                          <td key={j}><div className="tsk-skeleton-cell" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="tsk-empty-cell">
                        <div className="tsk-empty-state">
                          <i className="fas fa-inbox" />
                          <p>
                            No tasks match the column filters —{' '}
                            <button className="tsk-link-btn" onClick={clearColFilters}>Clear</button>
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : pagedTasks.map((t, rowIdx) => (
                    <tr
                      key={t.idTask}
                      className={[
                        t.state !== '1' ? 'tsk-row-inactive' : '',
                        rowIdx % 2 === 1    ? 'tsk-row-alt'    : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <td>
                        <button className="tsk-link-btn tsk-task-num" onClick={e => openEdit(t.idTask, e.currentTarget)}>
                          #{t.idTask}
                        </button>
                      </td>
                      <td className="tsk-cell-truncate" title={t.name}>{t.name}</td>
                      <td className="tsk-cell-truncate" title={t.clientName}>{t.clientName || '—'}</td>
                      <td>{t.typeTask || '—'}</td>
                      <td>{statusBadge(t.statusName)}</td>
                      <td>{priorityBadge(t.priorityName)}</td>
                      <td className="tsk-cell-truncate" title={t.assignedTo}>{t.assignedTo || '—'}</td>
                      <td>{t.fiscalYear || '—'}</td>
                      <td className="tsk-cell-truncate" title={t.clientAccount}>{t.clientAccount || '—'}</td>
                      <td>{fmt(t.startDateTime)}</td>
                      <td>{fmt(t.dueDateTime)}</td>
                      <td>
                        {deleteConfirmRow === t.idTask ? (
                          <div className="tsk-del-row-confirm">
                            <span>Delete?</span>
                            <button className="tsk-btn tsk-btn-danger tsk-btn-xs"
                              onClick={() => handleDeleteRow(t.idTask)} disabled={deleting}>
                              {deleting ? '...' : 'Yes'}
                            </button>
                            <button className="tsk-btn tsk-btn-ghost tsk-btn-xs"
                              onClick={() => setDeleteConfirmRow(null)}>No</button>
                          </div>
                        ) : (
                          <div className="tsk-actions">
                            <button className="tsk-action-btn tsk-action-client"
                              title="View Client" aria-label="View client details"
                              onClick={e => openClientModal(t, e.currentTarget)}>
                              <i className="fas fa-user" />
                            </button>
                            <button className="tsk-action-btn tsk-action-tracking"
                              title="Add Tracking" aria-label="Add tracking note"
                              onClick={e => openTrackingModal(t, e.currentTarget)}>
                              <i className="fas fa-comment-medical" />
                            </button>
                            <button className="tsk-action-btn tsk-action-edit"
                              title="Edit" aria-label="Edit task"
                              onClick={e => openEdit(t.idTask, e.currentTarget)}>
                              <i className="fas fa-pencil-alt" />
                            </button>
                            <button className="tsk-action-btn tsk-action-delete"
                              title="Delete" aria-label="Delete task"
                              onClick={() => setDeleteConfirmRow(t.idTask)}>
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="tsk-pagination">
                <div className="tsk-pag-info">
                  {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredTasks.length)} of {filteredTasks.length}
                </div>
                <div className="tsk-pag-controls">
                  <button
                    className="tsk-pag-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <i className="fas fa-chevron-left" />
                  </button>
                  {paginationPages(currentPage, totalPages).map((page, i) =>
                    page === '...'
                      ? <span key={`el-${i}`} className="tsk-pag-ellipsis">…</span>
                      : (
                        <button
                          key={page}
                          className={`tsk-pag-btn${page === currentPage ? ' tsk-pag-btn-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={page === currentPage ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      )
                  )}
                  <button
                    className="tsk-pag-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* CREATE */}
      {modalType === 'create' && (
        <div className="tsk-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="tsk-modal tsk-modal-lg" role="dialog" aria-modal="true" aria-label="New Task">
            <div className="tsk-modal-header">
              <h5><i className="fas fa-plus-circle" /> New Task</h5>
              <button className="tsk-modal-close" onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div className="tsk-modal-body">
              {renderMsg(detailMsg, setDetailMsg)}
              {!catalogsReady
                ? <div className="tsk-loading"><div className="tsk-spinner" /><span>Loading catalogs...</span></div>
                : renderTaskForm()
              }
            </div>
            <div className="tsk-modal-footer">
              <button className="tsk-btn tsk-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="tsk-btn tsk-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT */}
      {modalType === 'edit' && (
        <div className="tsk-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="tsk-modal tsk-modal-lg" role="dialog" aria-modal="true" aria-label="Edit Task">
            <div className="tsk-modal-header">
              <div className="tsk-modal-title-block">
                {taskDetail && (
                  <>
                    <span className="tsk-detail-task-id">#{taskDetail.idTask}</span>
                    <span className="tsk-detail-task-name">{taskDetail.name}</span>
                    {statusBadge(taskDetail.statusName)}
                  </>
                )}
              </div>
              <div className="tsk-modal-header-actions">
                {!showDelConfirm ? (
                  <>
                    <button className="tsk-btn tsk-btn-danger-ghost tsk-btn-sm" onClick={() => setShowDelConfirm(true)}>
                      <i className="fas fa-trash" /> Delete
                    </button>
                    {activeTab === 'details' && (
                      <button className="tsk-btn tsk-btn-primary tsk-btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="tsk-del-confirm">
                    <span>Delete this task?</span>
                    <button className="tsk-btn tsk-btn-danger tsk-btn-sm" onClick={handleDelete} disabled={deleting}>
                      {deleting ? '...' : 'Yes, delete'}
                    </button>
                    <button className="tsk-btn tsk-btn-ghost tsk-btn-sm" onClick={() => setShowDelConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                )}
                <button className="tsk-modal-close" onClick={closeModal} aria-label="Close">×</button>
              </div>
            </div>

            <div className="tsk-tabs">
              {[
                ['details',       'fas fa-file-alt',   'Details'],
                ['checklist',     'fas fa-list-check', 'Checklist'],
                ['notifications', 'fas fa-bell',       'Notifications'],
              ].map(([key, icon, label]) => (
                <button key={key} className={`tsk-tab${activeTab === key ? ' active' : ''}`}
                  onClick={() => handleTabChange(key)}>
                  <i className={icon} /> {label}
                </button>
              ))}
            </div>

            <div className="tsk-modal-body tsk-modal-body-tabs">
              {renderMsg(detailMsg, setDetailMsg)}
              {detailLoading
                ? <div className="tsk-loading"><div className="tsk-spinner" /><span>Loading task...</span></div>
                : (
                  <div className="tsk-tab-panel">
                    {activeTab === 'details'       && <>{renderTaskForm()}{renderCommentsSection()}</>}
                    {activeTab === 'checklist'     && renderChecklistTab()}
                    {activeTab === 'notifications' && renderNotificationsTab()}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}

      {/* CLIENT INFO */}
      {modalType === 'client' && selectedTaskRow && (
        <div className="tsk-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="tsk-modal tsk-modal-sm" role="dialog" aria-modal="true" aria-label="Client Information">
            <div className="tsk-modal-header">
              <h5><i className="fas fa-user" /> Client Information</h5>
              <button className="tsk-modal-close" onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div className="tsk-modal-body">
              {clientDetailsLoading
                ? <div className="tsk-loading-sm"><div className="tsk-spinner" /></div>
                : (
                  <div className="tsk-client-info">
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Client</span>
                      <span className="tsk-client-value">{clientDetails?.name || selectedTaskRow.clientName || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Email</span>
                      <span className="tsk-client-value">{clientDetails?.email || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Phone</span>
                      <span className="tsk-client-value">{clientDetails?.phone || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Address</span>
                      <span className="tsk-client-value">{clientDetails?.address || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Account</span>
                      <span className="tsk-client-value">{selectedTaskRow.clientAccount || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Group</span>
                      <span className="tsk-client-value">{selectedTaskRow.nameGroup || '—'}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Task</span>
                      <span className="tsk-client-value">#{selectedTaskRow.idTask} — {selectedTaskRow.name}</span>
                    </div>
                    <div className="tsk-client-field">
                      <span className="tsk-client-label">Status</span>
                      <span className="tsk-client-value">{statusBadge(selectedTaskRow.statusName)}</span>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="tsk-modal-footer">
              <button className="tsk-btn tsk-btn-ghost" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING MODAL */}
      {modalType === 'tracking' && selectedTaskRow && (() => {
        const timerH = Math.floor(timerDisplay / 3600);
        const timerM = Math.floor((timerDisplay % 3600) / 60);
        const timerS = timerDisplay % 60;
        return (
          <div className="tsk-modal-overlay">
            <div className="tsk-modal tsk-modal-tracking" role="dialog" aria-modal="true" aria-label="Task Tracking">
              <div className="tsk-modal-header">
                <h5><strong>Task</strong></h5>
                <button className="tsk-modal-close" onClick={closeModal} aria-label="Close">×</button>
              </div>

              <div className="tsk-trk-body">
                {/* ── LEFT COLUMN (55%) ────────────────────────────────── */}
                <div className="tsk-trk-left">
                  <div className="tsk-trk-info-panel">
                    <div className="tsk-trk-task-header">
                      <div className="tsk-trk-task-id">#{selectedTaskRow?.idTask}</div>
                      <div className="tsk-trk-task-name">{selectedTaskRow?.name}</div>
                    </div>
                    <div className="tsk-trk-task-meta">
                      {selectedTaskRow?.clientName && (
                        <div className="tsk-trk-meta-item">
                          <i className="fas fa-building tsk-trk-meta-icon" />
                          <span>{selectedTaskRow.clientName}</span>
                        </div>
                      )}
                      {selectedTaskRow?.fiscalYear && (
                        <div className="tsk-trk-meta-item">
                          <i className="fas fa-calendar tsk-trk-meta-icon" />
                          <span>Cal. Year: {selectedTaskRow.fiscalYear}</span>
                        </div>
                      )}
                      {selectedTaskRow?.clientAccount && (
                        <div className="tsk-trk-meta-item">
                          <i className="fas fa-file-invoice tsk-trk-meta-icon" />
                          <span>Account: {selectedTaskRow.clientAccount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {timerVisible && (
                    <div className="tsk-trk-timer-section">
                      <div className="tsk-trk-timer-display">
                        <span className="tsk-trk-timer-unit">{timerH}</span>
                        <span className="tsk-trk-timer-sep">H:</span>
                        <span className="tsk-trk-timer-unit">{String(timerM).padStart(2, '0')}</span>
                        <span className="tsk-trk-timer-sep">M:</span>
                        <span className="tsk-trk-timer-unit">{String(timerS).padStart(2, '0')}</span>
                        <span className="tsk-trk-timer-sep">S</span>
                      </div>
                      <div className="tsk-trk-controls">
                        <button className="tsk-trk-ctrl tsk-trk-ctrl-play"
                          title="Play" onClick={handlePlay}
                          disabled={!!activeTrackingId} aria-label="Start tracking">▶</button>
                        <button className="tsk-trk-ctrl tsk-trk-ctrl-pause"
                          title="Pause" onClick={handlePause}
                          disabled={!activeTrackingId} aria-label="Pause tracking">⏸</button>
                        <button className="tsk-trk-ctrl tsk-trk-ctrl-stop"
                          title="Stop" onClick={handleStop} aria-label="Stop tracking">⏹</button>
                      </div>
                      {timerCondition && (
                        <div className={`tsk-trk-condition tsk-trk-cond-${
                          timerCondition.toLowerCase().includes('work') ? 'working' :
                          timerCondition.toLowerCase().includes('comp') ? 'completed' :
                          timerCondition.toLowerCase().includes('paus') ? 'paused' : 'default'
                        }`}>
                          {timerCondition}
                        </div>
                      )}
                    </div>
                  )}

                  <hr className="tsk-trk-hr" />
                  <div className="tsk-trk-desc-section">
                    <strong>Description:</strong>
                    <textarea className="tsk-input tsk-textarea tsk-trk-desc" rows={3}
                      defaultValue={selectedTaskRow.description || ''} readOnly />
                  </div>

                  {selectedTracking && (
                    <>
                      <hr className="tsk-trk-hr" />
                      <div className="tsk-trk-detail">
                        <div><strong>Timelog Name</strong> {selectedTracking.name ?? '—'}</div>
                        <div><strong>Started on</strong> {fmt(selectedTracking.startDateTime)}</div>
                        <div><strong>Ended on</strong> {fmt(selectedTracking.dueDateTime)}</div>
                        <div><strong>Time Spent</strong> {(() => {
                          const isThisActive = activeTrackingId === selectedTracking?.idTracking;
                          // timerDisplay already = timeWork + elapsed (total), so use it directly when active
                          const liveSeconds = isThisActive
                            ? timerDisplay
                            : (selectedTracking?.timeWork ?? selectedTracking?.durationTime ?? 0);
                          return formatSeconds(liveSeconds);
                        })()}</div>
                        <div><strong>Status</strong> {trackingStatusBadge(selectedTracking.status, selectedTracking.idStatusTracking)}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* ── RIGHT COLUMN (45%) ───────────────────────────────── */}
                <div className="tsk-trk-right">
                  {/* Tracking section */}
                  <div className="tsk-trk-section-hdr">
                    <span><strong>&nbsp;Tracking</strong></span>
                    <button className="tsk-btn tsk-btn-primary tsk-trk-plus-btn"
                      onClick={openQuickCreate}>+</button>
                  </div>

                  {trackingMsg.text && (
                    <div className={`tsk-trk-alert tsk-trk-alert-${trackingMsg.type}`}>
                      {trackingMsg.text}
                      <button className="tsk-trk-alert-close"
                        onClick={() => setTrackingMsg({ type: '', text: '' })}>×</button>
                    </div>
                  )}

                  {trackingLoading ? (
                    <div className="tsk-trk-loading"><span className="tsk-spinner-sm" /> Loading…</div>
                  ) : (
                    <table className="tsk-trk-table">
                      <thead>
                        <tr><th className="tsk-trk-th">Trackings</th><th className="tsk-trk-th-action"></th></tr>
                      </thead>
                      <tbody>
                        {trackingList.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="tsk-trk-empty-cell">
                              <div className="tsk-trk-empty-state">
                                <i className="fas fa-clock tsk-trk-empty-icon" />
                                <span>No timelogs yet</span>
                                <small>Click <strong>+</strong> to start tracking time</small>
                              </div>
                            </td>
                          </tr>
                        ) : trackingList.map(trk => {
                          const trkId       = trk.idTracking ?? trk.IdTracking;
                          const trkName     = trk.name ?? trk.Name ?? trk.tracking ?? trk.Tracking ?? '—';
                          const trkStart    = trk.startDateTime ?? trk.StartDateTime;
                          const trkEnd      = trk.dueDateTime ?? trk.DueDateTime;
                          const trkDuration    = trk.timeWork ?? trk.TimeWork ?? trk.durationTime ?? trk.DurationTime ?? 0;
                          const trkStatusRaw   = trk.status ?? trk.Status ?? '';
                          const trkStatusId    = trk.idStatusTracking ?? trk.IdStatusTracking;
                          const trkStatus      = (trkStatusRaw && trkStatusRaw !== '—') ? trkStatusRaw : (trackingStatusIdLabel(trkStatusId) ?? '—');
                          const isActive       = trkId === activeTrackingId;
                          // timerDisplay = timeWork + elapsed (total), use directly when active
                          const liveDuration   = isActive ? timerDisplay : trkDuration;
                          return (
                          <tr key={trkId}
                            className={selectedTracking?.idTracking === trkId ? 'tsk-trk-row-sel' : ''}>
                            <td className="tsk-trk-row-cell">
                              <div><strong>Timelog Name</strong> {trkName}</div>
                              <div><strong>Started on</strong> {fmt(trkStart)}</div>
                              <div><strong>Ended on</strong> {fmt(trkEnd)}</div>
                              <div>
                                <strong>Time Spent</strong>
                                {formatSeconds(liveDuration)}
                                {isActive && (
                                  <span className="tsk-trk-live-dot">● live</span>
                                )}
                              </div>
                              <div><strong>Status</strong> {trackingStatusBadge(trkStatus, trkStatusId)}</div>
                            </td>
                            <td className="tsk-trk-row-action">
                              <button
                                className="tsk-btn tsk-btn-ghost tsk-trk-clock-btn"
                                title="Select for timer control"
                                aria-label="Select tracking"
                                onClick={() => handleSelectTracking({
                                  ...trk,
                                  idTracking:    trkId,
                                  name:          trkName,
                                  startDateTime: trkStart,
                                  dueDateTime:   trkEnd,
                                  durationTime:  trkDuration,
                                  status:        trkStatus,
                                })}>⌚</button>
                            </td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  )}

                  {/* Documents section (placeholder) */}
                  <div className="tsk-trk-section-hdr tsk-trk-section-hdr-mt">
                    <span><strong>&nbsp;Documents</strong></span>
                    <button className="tsk-btn tsk-btn-primary tsk-trk-plus-btn">+</button>
                  </div>
                  <table className="tsk-trk-table">
                    <thead>
                      <tr><th className="tsk-trk-th">Documents</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="tsk-trk-empty-cell">No documents.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="tsk-modal-footer">
                <button className="tsk-btn tsk-btn-ghost" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK CREATE TRACKING */}
      {showQuickCreate && modalType === 'tracking' && (
        <div className="tsk-modal-overlay tsk-modal-overlay-front">
          <div className="tsk-modal tsk-modal-md" role="dialog" aria-modal="true" aria-label="Quick Create Tracking">
            <div className="tsk-modal-header">
              <h5>Quick Create &rsaquo; Tracking</h5>
              <button className="tsk-modal-close" onClick={() => setShowQuickCreate(false)} aria-label="Close">×</button>
            </div>
            <div className="tsk-modal-body">
              <div className="tsk-trk-qc-grid">
                <div className="tsk-trk-qc-field tsk-trk-qc-full">
                  <label className="tsk-trk-qc-label">Tracking Name <span className="tsk-required">*</span></label>
                  <input className="tsk-input" type="text" value={quickCreateForm.name} autoFocus
                    placeholder="e.g. Initial review"
                    onChange={e => setQuickCreateForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="tsk-trk-qc-field tsk-trk-qc-full">
                  <label className="tsk-trk-qc-label">Related To</label>
                  <input className="tsk-input" type="text" value={selectedTaskRow?.name || ''} readOnly disabled />
                </div>
                <div className="tsk-trk-qc-field">
                  <label className="tsk-trk-qc-label">Start Date & Time <span className="tsk-required">*</span></label>
                  <input className="tsk-input" type="datetime-local" value={quickCreateForm.startDateTime}
                    onChange={e => setQuickCreateForm(p => ({ ...p, startDateTime: e.target.value }))} />
                </div>
                <div className="tsk-trk-qc-field">
                  <label className="tsk-trk-qc-label">Due Date & Time <span className="tsk-required">*</span></label>
                  <input className="tsk-input" type="datetime-local" value={quickCreateForm.dueDateTime}
                    onChange={e => setQuickCreateForm(p => ({ ...p, dueDateTime: e.target.value }))} />
                </div>
                <div className="tsk-trk-qc-field">
                  <label className="tsk-trk-qc-label">Assigned To <span className="tsk-required">*</span></label>
                  <select className="tsk-select" value={quickCreateForm.idEmployee}
                    onChange={e => setQuickCreateForm(p => ({ ...p, idEmployee: e.target.value }))}>
                    <option value="">— Select employee —</option>
                    {trackingEmployees.map(emp => (
                      <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="tsk-trk-qc-field">
                  <label className="tsk-trk-qc-label">Status</label>
                  <input className="tsk-input" type="text" value="Paused" readOnly disabled />
                </div>
              </div>
            </div>
            <div className="tsk-modal-footer">
              <button className="tsk-btn tsk-btn-ghost" onClick={() => setShowQuickCreate(false)}>Cancel</button>
              <button className="tsk-btn tsk-btn-primary" onClick={handleQuickCreateSave}
                disabled={savingQuickCreate || !quickCreateForm.name.trim()}>
                {savingQuickCreate ? 'Saving…' : 'Save Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
