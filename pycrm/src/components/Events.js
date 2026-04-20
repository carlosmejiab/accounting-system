// ===================================
// COMPONENTE: EVENTS  (lista + calendario FullCalendar)
// ===================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin  from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import eventService from '../services/eventService';
import clientService from '../services/clientService';
import '../styles/Events.css';

const EMPTY_FORM = {
  name:           '',
  startDateTime:  '',
  dueDateTime:    '',
  idStatusEvent:  '',
  idActivityType: '',
  idLocation:     '',
  idPriority:     '',
  relatedTo:      'client',
  idClient:       '',
  clientName:     '',
  idTask:         '',
  description:    '',
  isActive:       true,
  repeat:         false,
  idFrequency:    '',
  participantIds: [],
};

function toDatetimeLocal(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 16);
}

function fmtDt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export default function Events() {

  // ── View toggle: 'list' | 'calendar' ─────────────────────────────────────
  const [view, setView] = useState('list');

  // ── List data ─────────────────────────────────────────────────────────────
  const [events,         setEvents]         = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [search,         setSearch]         = useState('');

  // ── Catalogs ──────────────────────────────────────────────────────────────
  const [statusCat,       setStatusCat]       = useState([]);
  const [activityTypeCat, setActivityTypeCat] = useState([]);
  const [locationCat,     setLocationCat]     = useState([]);
  const [priorityCat,     setPriorityCat]     = useState([]);
  const [frequencyCat,    setFrequencyCat]    = useState([]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [formMsg,   setFormMsg]   = useState({ type: '', text: '' });
  const [saving,    setSaving]    = useState(false);

  // ── Participants ───────────────────────────────────────────────────────────
  const [allParticipants,     setAllParticipants]     = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch,   setParticipantSearch]   = useState('');

  // ── Client search ─────────────────────────────────────────────────────────
  const [clientSearch,        setClientSearch]        = useState(false);
  const [clientSearchTerm,    setClientSearchTerm]    = useState('');
  const [clientSearchList,    setClientSearchList]    = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);

  // ── Calendar tooltip ─────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimer = useRef(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    const [listRes, calRes] = await Promise.all([
      eventService.getAll(),
      eventService.getCalendar(),
    ]);
    if (listRes.success) setEvents(listRes.data);
    if (calRes.success)  setCalendarEvents(calRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
    eventService.getCatalog('MStatusEvent').then(r  => { if (r.success) setStatusCat(r.data); });
    eventService.getCatalog('MActivityType').then(r => { if (r.success) setActivityTypeCat(r.data); });
    eventService.getCatalog('MLocationes').then(r   => { if (r.success) setLocationCat(r.data); });
    eventService.getCatalog('MPriority').then(r     => { if (r.success) setPriorityCat(r.data); });
    eventService.getCatalog('MRepeatEvent').then(r  => { if (r.success) setFrequencyCat(r.data); });
  }, [loadEvents]);

  // ── Participants ───────────────────────────────────────────────────────────
  const loadParticipants = useCallback(async (idEvent) => {
    setParticipantsLoading(true);
    const res = await eventService.getParticipants(idEvent || 0);
    if (res.success) setAllParticipants(res.data);
    setParticipantsLoading(false);
  }, []);

  const toggleParticipant = (id) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter(x => x !== id)
        : [...prev.participantIds, id],
    }));
  };

  useEffect(() => {
    if (modalMode === 'edit' && allParticipants.length > 0) {
      const sel = allParticipants.filter(p => p.isSelected).map(p => p.idEmployee);
      setFormData(prev => ({ ...prev, participantIds: sel }));
    }
  }, [allParticipants, modalMode]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const buildForm = (row) => ({
    name:           row.name           || '',
    startDateTime:  toDatetimeLocal(row.startDateTime),
    dueDateTime:    toDatetimeLocal(row.dueDateTime),
    idStatusEvent:  row.idStatusEvent  || '',
    idActivityType: row.idActivityType || '',
    idLocation:     row.idLocation     || '',
    idPriority:     row.idPriority     || '',
    relatedTo:      row.idTask ? 'task' : 'client',
    idClient:       row.idClient   || '',
    clientName:     row.clientName || '',
    idTask:         row.idTask     || '',
    description:    row.description || '',
    isActive:       row.state === '1' || row.state === 1,
    repeat:         !!(row.idFrequency),
    idFrequency:    row.idFrequency || '',
    participantIds: [],
  });

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormMsg({ type: '', text: '' });
    setEditingId(null);
    setModalMode('create');
    setAllParticipants([]);
    setParticipantSearch('');
    setModalOpen(true);
    loadParticipants(0);
  };

  const openEdit = (row) => {
    setFormData(buildForm(row));
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idEvent || row.id);
    setModalMode('edit');
    setAllParticipants([]);
    setParticipantSearch('');
    setModalOpen(true);
    loadParticipants(row.idEvent || row.id);
  };

  const openDelete = (row) => {
    setFormData(buildForm(row));
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idEvent || row.id);
    setModalMode('delete');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setClientSearch(false);
  };

  // ── Client search ─────────────────────────────────────────────────────────
  const openClientSearch = async () => {
    setClientSearch(true);
    setClientSearchTerm('');
    setClientSearchLoading(true);
    const res = await (clientService.getAll?.() || Promise.resolve({ success: false, data: [] }));
    setClientSearchList(res.success ? res.data : []);
    setClientSearchLoading(false);
  };

  const filteredClients = clientSearchList.filter(c =>
    (c.name  || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const selectClient = (c) => {
    setFormData(prev => ({
      ...prev,
      idClient:   c.idClient || c.id || '',
      clientName: c.name     || c.Name || '',
    }));
    setClientSearch(false);
  };

  // ── Save / Delete ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (modalMode === 'delete') {
      setSaving(true);
      const res = await eventService.delete(editingId);
      if (res.success) { setModalOpen(false); await loadEvents(); }
      else setFormMsg({ type: 'error', text: res.message });
      setSaving(false);
      return;
    }

    if (!formData.name.trim())    { setFormMsg({ type: 'error', text: 'Name is required.' }); return; }
    if (!formData.startDateTime)  { setFormMsg({ type: 'error', text: 'Start Date & Time is required.' }); return; }
    if (!formData.dueDateTime)    { setFormMsg({ type: 'error', text: 'Due Date & Time is required.' }); return; }
    if (!formData.idStatusEvent)  { setFormMsg({ type: 'error', text: 'Status is required.' }); return; }
    if (!formData.idActivityType) { setFormMsg({ type: 'error', text: 'Activity Type is required.' }); return; }
    if (!formData.idLocation)     { setFormMsg({ type: 'error', text: 'Location is required.' }); return; }
    if (!formData.idPriority)     { setFormMsg({ type: 'error', text: 'Priority is required.' }); return; }

    setSaving(true);
    setFormMsg({ type: '', text: '' });

    const payload = {
      name:           formData.name.trim(),
      startDateTime:  formData.startDateTime,
      dueDateTime:    formData.dueDateTime,
      idStatusEvent:  parseInt(formData.idStatusEvent,  10),
      idActivityType: parseInt(formData.idActivityType, 10),
      idLocation:     parseInt(formData.idLocation,     10),
      idPriority:     parseInt(formData.idPriority,     10),
      idClient:       formData.relatedTo === 'client' && formData.idClient ? parseInt(formData.idClient, 10) : null,
      idTask:         formData.relatedTo === 'task'   && formData.idTask   ? parseInt(formData.idTask,   10) : null,
      description:    formData.description || null,
      isActive:       formData.isActive,
      idFrequency:    formData.repeat && formData.idFrequency ? parseInt(formData.idFrequency, 10) : null,
      participantIds: formData.participantIds,
    };

    const res = modalMode === 'create'
      ? await eventService.create(payload)
      : await eventService.update(editingId, payload);

    if (res.success) { setModalOpen(false); await loadEvents(); }
    else setFormMsg({ type: 'error', text: res.message });
    setSaving(false);
  };

  // ── Calendar handlers ──────────────────────────────────────────────────────
  const handleCalendarEventMouseEnter = (info) => {
    clearTimeout(tooltipTimer.current);
    const ev  = info.event;
    const ext = ev.extendedProps;
    tooltipTimer.current = setTimeout(() => {
      setTooltip({
        x:    info.jsEvent.clientX + 12,
        y:    info.jsEvent.clientY + 12,
        title: ev.title,
        description:  ext.description,
        client:       ext.clientName,
        activityType: ext.activityType,
        status:       ext.status,
        start:        ev.start,
        end:          ev.end,
      });
    }, 180);
  };

  const handleCalendarEventMouseLeave = () => {
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
  };

  const handleCalendarEventClick = useCallback((info) => {
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
    const id = parseInt(info.event.id, 10);
    // Find full event data in list; if not found, fetch from API
    const row = events.find(e => e.idEvent === id);
    if (row) {
      openEdit(row);
    } else {
      eventService.getById(id).then(res => {
        if (res.success && res.data) openEdit(res.data);
      });
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.name         || '').toLowerCase().includes(q) ||
      (e.clientName   || '').toLowerCase().includes(q) ||
      (e.status       || '').toLowerCase().includes(q) ||
      (e.activityType || '').toLowerCase().includes(q)
    );
  });

  const filteredParticipants = allParticipants.filter(p =>
    p.fullName.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const readOnly = modalMode === 'delete';

  // ── FullCalendar event objects ─────────────────────────────────────────────
  const fcEvents = calendarEvents.map(e => ({
    id:    String(e.id),
    title: e.title,
    start: e.start,
    end:   e.end,
    backgroundColor: e.color      || '#f59e0b',
    borderColor:     e.color      || '#f59e0b',
    textColor:       e.textColor  || '#1a1a2e',
    extendedProps: {
      description:  e.description,
      clientName:   e.clientName,
      taskName:     e.taskName,
      activityType: e.activityType,
      status:       e.status,
    },
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ev-container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="ev-header">
        <h2 className="ev-title">
          <i className="fas fa-calendar-alt" /> Events
        </h2>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="ev-toolbar">
        {view === 'list' && (
          <input
            className="ev-search"
            type="text"
            placeholder="Search by name, client, status or activity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
        {view === 'calendar' && <div style={{ flex: 1 }} />}

        <div className="ev-view-toggle">
          <button
            className={`ev-view-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title="List view">
            <i className="fas fa-list" /> List
          </button>
          <button
            className={`ev-view-btn${view === 'calendar' ? ' active' : ''}`}
            onClick={() => setView('calendar')}
            title="Calendar view">
            <i className="fas fa-calendar" /> Calendar
          </button>
        </div>

        <button className="ev-btn ev-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus" /> Add Event
        </button>
      </div>

      {/* ── LIST VIEW ──────────────────────────────────────────────────── */}
      {view === 'list' && (
        loading
          ? <div className="ev-loading"><div className="ev-spinner" /></div>
          : (
            <div className="ev-table-wrap">
              <table className="ev-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Client / Task</th>
                    <th>Start</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Activity Type</th>
                    <th className="ev-th-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={7} className="ev-empty">
                        {search ? 'No results found.' : 'No events registered.'}
                      </td></tr>
                    : filtered.map(row => (
                      <tr key={row.idEvent}>
                        <td>{row.name || '—'}</td>
                        <td>{row.clientName || row.taskName || '—'}</td>
                        <td>{fmtDt(row.startDateTime)}</td>
                        <td>{fmtDt(row.dueDateTime)}</td>
                        <td>{row.status       || '—'}</td>
                        <td>{row.activityType || '—'}</td>
                        <td className="ev-td-center ev-td-actions">
                          <button className="ev-action-btn ev-action-edit"
                            title="Edit" onClick={() => openEdit(row)}>
                            <i className="fas fa-pencil-alt" />
                          </button>
                          <button className="ev-action-btn ev-action-delete"
                            title="Delete" onClick={() => openDelete(row)}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── CALENDAR VIEW ──────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="ev-calendar-wrap">
          {loading
            ? <div className="ev-loading"><div className="ev-spinner" /></div>
            : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left:   'prev,next today',
                  center: 'title',
                  right:  'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week:  'Week',
                  day:   'Day',
                }}
                events={fcEvents}
                eventDisplay="block"
                eventClick={handleCalendarEventClick}
                eventMouseEnter={handleCalendarEventMouseEnter}
                eventMouseLeave={handleCalendarEventMouseLeave}
                height="auto"
                editable={false}
                selectable={false}
                dayMaxEvents={4}
              />
            )
          }
        </div>
      )}

      {/* ── Hover Tooltip ──────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="ev-tooltip"
          style={{ top: tooltip.y, left: tooltip.x }}>
          <div className="ev-tooltip-title">{tooltip.title}</div>
          {tooltip.client       && <div className="ev-tooltip-detail"><i className="fas fa-user" style={{ marginRight: 4 }} />{tooltip.client}</div>}
          {tooltip.activityType && <div className="ev-tooltip-detail"><i className="fas fa-tag"  style={{ marginRight: 4 }} />{tooltip.activityType}</div>}
          {tooltip.status       && <div className="ev-tooltip-detail"><i className="fas fa-circle" style={{ marginRight: 4 }} />{tooltip.status}</div>}
          {tooltip.description  && <div className="ev-tooltip-detail" style={{ marginTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.3rem' }}>{tooltip.description}</div>}
          <div className="ev-tooltip-detail" style={{ marginTop: '0.3rem' }}>
            {fmtDt(tooltip.start)}{tooltip.end && tooltip.end !== tooltip.start ? ` → ${fmtDt(tooltip.end)}` : ''}
          </div>
        </div>
      )}

      {/* ── Form Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="ev-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="ev-modal">

            <div className="ev-modal-header">
              <h5>
                {modalMode === 'create' && 'New Event'}
                {modalMode === 'edit'   && 'Update Event'}
                {modalMode === 'delete' && 'Delete Event'}
              </h5>
              <button className="ev-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="ev-modal-body">
              {formMsg.text && (
                <div className={`ev-alert ev-alert-${formMsg.type}`}>{formMsg.text}</div>
              )}

              {/* Delete confirmation */}
              {modalMode === 'delete' && (
                <div className="ev-delete-info">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Start:</strong> {formData.startDateTime}</p>
                  <p><strong>Due:</strong>   {formData.dueDateTime}</p>
                  {formData.clientName && <p><strong>Client:</strong> {formData.clientName}</p>}
                  <p style={{ color: '#991b1b', marginTop: '0.5rem' }}>
                    <i className="fas fa-exclamation-triangle" /> This action cannot be undone.
                  </p>
                </div>
              )}

              {modalMode !== 'delete' && (
                <>
                  <p className="ev-form-section-title">Event Details</p>
                  <div className="ev-form-grid" style={{ marginBottom: '0.75rem' }}>

                    {/* Name */}
                    <div className="ev-field ev-field-full">
                      <label className="ev-label">Name <span className="ev-required">*</span></label>
                      <input className="ev-input" type="text" maxLength={150}
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                    </div>

                    {/* Start / Due */}
                    <div className="ev-field">
                      <label className="ev-label">Start Date &amp; Time <span className="ev-required">*</span></label>
                      <input className="ev-input" type="datetime-local"
                        value={formData.startDateTime}
                        onChange={e => setFormData(p => ({ ...p, startDateTime: e.target.value }))} />
                    </div>
                    <div className="ev-field">
                      <label className="ev-label">Due Date &amp; Time <span className="ev-required">*</span></label>
                      <input className="ev-input" type="datetime-local"
                        value={formData.dueDateTime}
                        onChange={e => setFormData(p => ({ ...p, dueDateTime: e.target.value }))} />
                    </div>

                    {/* Status / Activity Type */}
                    <div className="ev-field">
                      <label className="ev-label">Status <span className="ev-required">*</span></label>
                      <select className="ev-select" value={formData.idStatusEvent}
                        onChange={e => setFormData(p => ({ ...p, idStatusEvent: e.target.value }))}>
                        <option value="">— Select —</option>
                        {statusCat.map(o => <option key={o.idTabla} value={o.idTabla}>{o.description}</option>)}
                      </select>
                    </div>
                    <div className="ev-field">
                      <label className="ev-label">Activity Type <span className="ev-required">*</span></label>
                      <select className="ev-select" value={formData.idActivityType}
                        onChange={e => setFormData(p => ({ ...p, idActivityType: e.target.value }))}>
                        <option value="">— Select —</option>
                        {activityTypeCat.map(o => <option key={o.idTabla} value={o.idTabla}>{o.description}</option>)}
                      </select>
                    </div>

                    {/* Location / Priority */}
                    <div className="ev-field">
                      <label className="ev-label">Location <span className="ev-required">*</span></label>
                      <select className="ev-select" value={formData.idLocation}
                        onChange={e => setFormData(p => ({ ...p, idLocation: e.target.value }))}>
                        <option value="">— Select —</option>
                        {locationCat.map(o => <option key={o.idTabla} value={o.idTabla}>{o.description}</option>)}
                      </select>
                    </div>
                    <div className="ev-field">
                      <label className="ev-label">Priority <span className="ev-required">*</span></label>
                      <select className="ev-select" value={formData.idPriority}
                        onChange={e => setFormData(p => ({ ...p, idPriority: e.target.value }))}>
                        <option value="">— Select —</option>
                        {priorityCat.map(o => <option key={o.idTabla} value={o.idTabla}>{o.description}</option>)}
                      </select>
                    </div>

                    {/* Related To */}
                    <div className="ev-field">
                      <label className="ev-label">Related To</label>
                      <select className="ev-select" value={formData.relatedTo}
                        onChange={e => setFormData(p => ({ ...p, relatedTo: e.target.value, idClient: '', clientName: '', idTask: '' }))}>
                        <option value="client">Client</option>
                        <option value="task">Task</option>
                      </select>
                    </div>

                    {/* Client or Task */}
                    {formData.relatedTo === 'client' ? (
                      <div className="ev-field">
                        <label className="ev-label">Client</label>
                        <div className="ev-input-group">
                          <input className="ev-input" type="text" readOnly
                            value={formData.clientName} placeholder="Select a client..." />
                          <button className="ev-input-btn" type="button" onClick={openClientSearch}>
                            <i className="fas fa-search" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ev-field">
                        <label className="ev-label">Task ID</label>
                        <input className="ev-input" type="number" placeholder="Enter task ID..."
                          value={formData.idTask}
                          onChange={e => setFormData(p => ({ ...p, idTask: e.target.value }))} />
                      </div>
                    )}

                    {/* Repeat */}
                    <div className="ev-field ev-field-checkbox">
                      <input type="checkbox" id="ev-repeat"
                        checked={formData.repeat}
                        onChange={e => setFormData(p => ({ ...p, repeat: e.target.checked, idFrequency: '' }))} />
                      <label className="ev-label" htmlFor="ev-repeat">Repeat</label>
                    </div>
                    <div className="ev-field">
                      <label className="ev-label">Frequency</label>
                      <select className="ev-select" value={formData.idFrequency}
                        disabled={!formData.repeat}
                        onChange={e => setFormData(p => ({ ...p, idFrequency: e.target.value }))}>
                        <option value="">— None —</option>
                        {frequencyCat.map(o => <option key={o.idTabla} value={o.idTabla}>{o.description}</option>)}
                      </select>
                    </div>

                    {/* State */}
                    <div className="ev-field ev-field-checkbox">
                      <input type="checkbox" id="ev-state"
                        checked={formData.isActive}
                        onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} />
                      <label className="ev-label" htmlFor="ev-state">Active</label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="ev-field" style={{ marginBottom: '0.75rem' }}>
                    <label className="ev-label">Description</label>
                    <textarea className="ev-textarea" maxLength={500}
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                  </div>

                  {/* Participants */}
                  <p className="ev-form-section-title">Participants</p>
                  <div className="ev-field" style={{ marginBottom: '0.4rem' }}>
                    <input className="ev-search" type="text" placeholder="Filter participants..."
                      value={participantSearch}
                      onChange={e => setParticipantSearch(e.target.value)} />
                  </div>
                  <div className="ev-participants-list">
                    {participantsLoading
                      ? <div className="ev-participants-loading"><i className="fas fa-spinner fa-spin" /> Loading...</div>
                      : filteredParticipants.length === 0
                        ? <div className="ev-participants-loading">No employees found.</div>
                        : filteredParticipants.map(p => (
                          <label key={p.idEmployee} className="ev-participants-item">
                            <input type="checkbox"
                              checked={formData.participantIds.includes(p.idEmployee)}
                              onChange={() => toggleParticipant(p.idEmployee)} />
                            {p.fullName}
                          </label>
                        ))
                    }
                  </div>
                </>
              )}
            </div>

            <div className="ev-modal-footer">
              <button className="ev-btn ev-btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              {modalMode === 'create' && (
                <button className="ev-btn ev-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Yes, save'}
                </button>
              )}
              {modalMode === 'edit' && (
                <button className="ev-btn ev-btn-warning" onClick={handleSave} disabled={saving}>
                  {saving ? 'Updating...' : 'Yes, update'}
                </button>
              )}
              {modalMode === 'delete' && (
                <button className="ev-btn ev-btn-danger" onClick={handleSave} disabled={saving}>
                  {saving ? 'Deleting...' : 'Yes, delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Client Search Modal ─────────────────────────────────────────── */}
      {clientSearch && (
        <div className="ev-overlay ev-overlay-front">
          <div className="ev-modal ev-modal-lg">
            <div className="ev-modal-header">
              <h5><i className="fas fa-search" /> Search Client</h5>
              <button className="ev-modal-close" onClick={() => setClientSearch(false)}>&times;</button>
            </div>
            <div className="ev-modal-body">
              <input className="ev-search ev-search-full" type="text"
                placeholder="Search by name or email..."
                value={clientSearchTerm} autoFocus
                onChange={e => setClientSearchTerm(e.target.value)} />
              {clientSearchLoading
                ? <div className="ev-loading"><div className="ev-spinner" /></div>
                : (
                  <div className="ev-table-wrap ev-table-wrap-modal">
                    <table className="ev-table">
                      <thead>
                        <tr>
                          <th>Client Name</th><th>Email</th>
                          <th>Type</th><th>Phone</th><th>City</th>
                          <th className="ev-th-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.length === 0
                          ? <tr><td colSpan={6} className="ev-empty">No clients found.</td></tr>
                          : filteredClients.map(c => (
                            <tr key={c.idClient || c.id}>
                              <td>{c.name || c.Name}</td>
                              <td>{c.email || '—'}</td>
                              <td>{c.typeClient || '—'}</td>
                              <td>{c.phone || '—'}</td>
                              <td>{c.city  || '—'}</td>
                              <td className="ev-td-center">
                                <button className="ev-action-btn ev-action-select"
                                  onClick={() => selectClient(c)}>
                                  <i className="fas fa-check" />
                                </button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
