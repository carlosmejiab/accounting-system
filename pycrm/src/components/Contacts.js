// ===================================
// CONTACTS — CRUD module
// ===================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import contactService from '../services/contactService';
import '../styles/Contacts.css';

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

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = {
  idClient: '', idTitles: '', idEmployee: '', idCity: '',
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', address: '', wordAreas: '', description: '',
  preferredChannel: '',
};

// ══════════════════════════════════════════════════════════════════════════════
export default function Contacts() {

  // ── List state ────────────────────────────────────────────────────────────
  const [contacts,    setContacts]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [listMsg,     setListMsg]     = useState({ type: '', text: '' });
  const [searchTerm,  setSearchTerm]  = useState('');
  const [filterClient, setFilterClient] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalType,    setModalType]    = useState(null); // 'create' | 'edit' | 'detail' | 'delete'
  const [selectedRow,  setSelectedRow]  = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [formMsg,  setFormMsg]  = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(false);

  // ── Catalogs ──────────────────────────────────────────────────────────────
  const [clients,           setClients]           = useState([]);
  const [titles,            setTitles]            = useState([]);
  const [employees,         setEmployees]         = useState([]);
  const [preferredChannels, setPreferredChannels] = useState([]);
  const [states,            setStates]            = useState([]);
  const [cities,            setCities]            = useState([]);
  const [catalogsReady,     setCatalogsReady]     = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const successTimerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD CATALOGS
  // ─────────────────────────────────────────────────────────────────────────
  const loadCatalogs = useCallback(async () => {
    const [cliR, titR, empR, chanR, stR] = await Promise.all([
      contactService.getClients(),
      contactService.getTitles(),
      contactService.getEmployees(),
      contactService.getPreferredChannels(),
      contactService.getStates(),
    ]);
    if (cliR.success)  setClients(cliR.data);
    if (titR.success)  setTitles(titR.data);
    if (empR.success)  setEmployees(empR.data);
    if (chanR.success) setPreferredChannels(chanR.data);
    if (stR.success)   setStates(stR.data);
    setCatalogsReady(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD ALL CONTACTS
  // ─────────────────────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    setLoading(true);
    const res = await contactService.getAll();
    if (res.success) {
      setContacts(res.data);
    } else {
      setListMsg({ type: 'error', text: res.message });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCatalogs();
    loadContacts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key closes modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && modalType) closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CITY CASCADE
  // ─────────────────────────────────────────────────────────────────────────
  const handleStateChange = async (stateId) => {
    setFormData(f => ({ ...f, idState: stateId, idCity: '' }));
    setCities([]);
    if (!stateId) return;
    const res = await contactService.getCitiesByState(stateId);
    if (res.success) setCities(res.data);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const showSuccess = (msg) => {
    clearTimeout(successTimerRef.current);
    setListMsg({ type: 'success', text: msg });
    successTimerRef.current = setTimeout(() => setListMsg({ type: '', text: '' }), 3500);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRow(null);
    setFormData(emptyForm);
    setFormMsg({ type: '', text: '' });
    setCities([]);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setFormMsg({ type: '', text: '' });
    setModalType('create');
  };

  const openEdit = (row) => {
    setSelectedRow(row);
    setFormData({
      idClient:         String(row.idClient         || ''),
      idTitles:         String(row.idTitles          || ''),
      idEmployee:       String(row.idEmployee        || ''),
      idCity:           String(row.idCity            || ''),
      firstName:        row.firstName                || '',
      lastName:         row.lastName                 || '',
      email:            row.email                    || '',
      phone:            row.phone                    || '',
      dateOfBirth:      fmtInput(row.dateOfBirth),
      address:          row.address                  || '',
      wordAreas:        row.wordAreas                || '',
      description:      row.description              || '',
      preferredChannel: String(row.preferredChannel  || ''),
    });
    setFormMsg({ type: '', text: '' });
    setModalType('edit');
  };

  const openDetail = (row) => {
    setSelectedRow(row);
    setModalType('detail');
  };

  const openDelete = (row) => {
    setSelectedRow(row);
    setModalType('delete');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormMsg({ type: '', text: '' });
    if (!formData.firstName.trim()) {
      setFormMsg({ type: 'error', text: 'First name is required' });
      return;
    }
    if (!formData.idClient) {
      setFormMsg({ type: 'error', text: 'Client is required' });
      return;
    }

    setSaving(true);
    const res = modalType === 'create'
      ? await contactService.create(formData)
      : await contactService.update(selectedRow.idContact, formData);

    if (res.success) {
      closeModal();
      showSuccess(res.message || (modalType === 'create' ? 'Contact created' : 'Contact updated'));
      await loadContacts();
    } else {
      setFormMsg({ type: 'error', text: res.message });
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    const res = await contactService.delete(selectedRow.idContact);
    if (res.success) {
      closeModal();
      showSuccess(res.message || 'Contact deleted');
      await loadContacts();
    } else {
      setListMsg({ type: 'error', text: res.message });
      closeModal();
    }
    setDeleting(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERED LIST
  // ─────────────────────────────────────────────────────────────────────────
  const filtered = contacts.filter(c => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const matchSearch = !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm);
    const matchClient = !filterClient ||
      String(c.idClient) === filterClient;
    return matchSearch && matchClient;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cnt-container">

      {/* ── Header ── */}
      <div className="cnt-header">
        <div className="cnt-header-left">
          <h4><i className="fas fa-address-book me-2" />Contacts</h4>
          <span className="cnt-count">{contacts.length} records</span>
        </div>
        <button className="cnt-btn cnt-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-1" /> New Contact
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="cnt-filters">
        <div className="cnt-search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            className="cnt-input"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cnt-clear-btn" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
        <select
          className="cnt-select"
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
        >
          <option value="">All clients</option>
          {clients.map(c => (
            <option key={c.idClient} value={String(c.idClient)}>{c.name}</option>
          ))}
        </select>
        <button className="cnt-btn cnt-btn-ghost" onClick={loadContacts} title="Refresh">
          <i className="fas fa-sync-alt" />
        </button>
      </div>

      {/* ── Alert ── */}
      {listMsg.text && (
        <div className={`cnt-alert cnt-alert-${listMsg.type}`}>
          <i className={`fas ${listMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`} />
          {listMsg.text}
          <button className="cnt-alert-close" onClick={() => setListMsg({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="cnt-table-wrapper">
        {loading ? (
          <div className="cnt-loading"><div className="cnt-spinner" /><span>Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="cnt-empty">
            <i className="fas fa-address-book" />
            <p>{contacts.length === 0 ? 'No contacts found' : 'No matches for the current filters'}</p>
          </div>
        ) : (
          <table className="cnt-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Title</th>
                <th>Channel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.idContact}>
                  <td className="cnt-id">{c.idContact}</td>
                  <td className="cnt-name">
                    <span className="cnt-avatar">{(c.firstName || '?')[0].toUpperCase()}</span>
                    <div>
                      <div className="cnt-fullname">{c.firstName} {c.lastName}</div>
                      {c.wordAreas && <div className="cnt-areas">{c.wordAreas}</div>}
                    </div>
                  </td>
                  <td>{c.clientName || '—'}</td>
                  <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.titleName || '—'}</td>
                  <td>{c.preferredChannelName || '—'}</td>
                  <td className="cnt-actions">
                    <button className="cnt-action-btn cnt-action-view" onClick={() => openDetail(c)} title="View">
                      <i className="fas fa-eye" />
                    </button>
                    <button className="cnt-action-btn cnt-action-edit" onClick={() => openEdit(c)} title="Edit">
                      <i className="fas fa-edit" />
                    </button>
                    <button className="cnt-action-btn cnt-action-delete" onClick={() => openDelete(c)} title="Delete">
                      <i className="fas fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — CREATE / EDIT
      ══════════════════════════════════════════════════════════════════ */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="cnt-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="cnt-modal cnt-modal-lg" role="dialog" aria-modal="true">
            <div className="cnt-modal-header">
              <h5>
                <i className={`fas ${modalType === 'create' ? 'fa-plus-circle' : 'fa-edit'} me-2`} />
                {modalType === 'create' ? 'New Contact' : 'Edit Contact'}
              </h5>
              <button className="cnt-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="cnt-modal-body">
              {formMsg.text && (
                <div className={`cnt-alert cnt-alert-${formMsg.type} mb-3`}>
                  {formMsg.text}
                </div>
              )}

              <div className="cnt-form-grid">

                {/* Client (required) */}
                <div className="cnt-field cnt-field-full">
                  <label className="cnt-label">Client <span className="cnt-required">*</span></label>
                  <select
                    className="cnt-select-input"
                    value={formData.idClient}
                    onChange={e => setFormData(f => ({ ...f, idClient: e.target.value }))}
                    disabled={!catalogsReady}
                  >
                    <option value="">— Select client —</option>
                    {clients.map(c => (
                      <option key={c.idClient} value={c.idClient}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="cnt-field">
                  <label className="cnt-label">Title</label>
                  <select
                    className="cnt-select-input"
                    value={formData.idTitles}
                    onChange={e => setFormData(f => ({ ...f, idTitles: e.target.value }))}
                    disabled={!catalogsReady}
                  >
                    <option value="">— None —</option>
                    {titles.map(t => (
                      <option key={t.idTitle} value={t.idTitle}>{t.titleName}</option>
                    ))}
                  </select>
                </div>

                {/* Preferred Channel */}
                <div className="cnt-field">
                  <label className="cnt-label">Preferred Channel</label>
                  <select
                    className="cnt-select-input"
                    value={formData.preferredChannel}
                    onChange={e => setFormData(f => ({ ...f, preferredChannel: e.target.value }))}
                    disabled={!catalogsReady}
                  >
                    <option value="">— None —</option>
                    {preferredChannels.map(ch => (
                      <option key={ch.idPreferredChannel} value={ch.idPreferredChannel}>{ch.preferredChannelName}</option>
                    ))}
                  </select>
                </div>

                {/* First Name (required) */}
                <div className="cnt-field">
                  <label className="cnt-label">First Name <span className="cnt-required">*</span></label>
                  <input
                    type="text"
                    className="cnt-text-input"
                    value={formData.firstName}
                    onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="First name"
                    maxLength={100}
                  />
                </div>

                {/* Last Name */}
                <div className="cnt-field">
                  <label className="cnt-label">Last Name</label>
                  <input
                    type="text"
                    className="cnt-text-input"
                    value={formData.lastName}
                    onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Last name"
                    maxLength={100}
                  />
                </div>

                {/* Email */}
                <div className="cnt-field">
                  <label className="cnt-label">Email</label>
                  <input
                    type="email"
                    className="cnt-text-input"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    maxLength={150}
                  />
                </div>

                {/* Phone */}
                <div className="cnt-field">
                  <label className="cnt-label">Phone</label>
                  <input
                    type="tel"
                    className="cnt-text-input"
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number"
                    maxLength={20}
                  />
                </div>

                {/* Date of Birth */}
                <div className="cnt-field">
                  <label className="cnt-label">Date of Birth</label>
                  <input
                    type="date"
                    className="cnt-text-input"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>

                {/* Assigned Employee */}
                <div className="cnt-field">
                  <label className="cnt-label">Assigned Employee</label>
                  <select
                    className="cnt-select-input"
                    value={formData.idEmployee}
                    onChange={e => setFormData(f => ({ ...f, idEmployee: e.target.value }))}
                    disabled={!catalogsReady}
                  >
                    <option value="">— None —</option>
                    {employees.map(emp => (
                      <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* State → City */}
                <div className="cnt-field">
                  <label className="cnt-label">State</label>
                  <select
                    className="cnt-select-input"
                    value={formData.idState || ''}
                    onChange={e => handleStateChange(e.target.value)}
                    disabled={!catalogsReady}
                  >
                    <option value="">— None —</option>
                    {states.map(s => (
                      <option key={s.idState} value={s.idState}>{s.nameState}</option>
                    ))}
                  </select>
                </div>

                <div className="cnt-field">
                  <label className="cnt-label">City</label>
                  <select
                    className="cnt-select-input"
                    value={formData.idCity}
                    onChange={e => setFormData(f => ({ ...f, idCity: e.target.value }))}
                    disabled={!formData.idState}
                  >
                    <option value="">— None —</option>
                    {cities.map(c => (
                      <option key={c.idCity} value={c.idCity}>{c.nameCity}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="cnt-field cnt-field-full">
                  <label className="cnt-label">Address</label>
                  <input
                    type="text"
                    className="cnt-text-input"
                    value={formData.address}
                    onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                    maxLength={200}
                  />
                </div>

                {/* Word Areas */}
                <div className="cnt-field cnt-field-full">
                  <label className="cnt-label">Work Area / Position</label>
                  <input
                    type="text"
                    className="cnt-text-input"
                    value={formData.wordAreas}
                    onChange={e => setFormData(f => ({ ...f, wordAreas: e.target.value }))}
                    placeholder="e.g. Accounting, HR..."
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="cnt-field cnt-field-full">
                  <label className="cnt-label">Notes / Description</label>
                  <textarea
                    className="cnt-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Additional notes..."
                    maxLength={500}
                  />
                </div>

              </div>
            </div>

            <div className="cnt-modal-footer">
              <button className="cnt-btn cnt-btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="cnt-btn cnt-btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><i className="fas fa-spinner fa-spin me-1" />Saving...</>
                  : <><i className="fas fa-save me-1" />{modalType === 'create' ? 'Create' : 'Save Changes'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — DETAIL
      ══════════════════════════════════════════════════════════════════ */}
      {modalType === 'detail' && selectedRow && (
        <div className="cnt-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="cnt-modal" role="dialog" aria-modal="true">
            <div className="cnt-modal-header">
              <h5><i className="fas fa-address-card me-2" />Contact Details</h5>
              <button className="cnt-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="cnt-modal-body">
              <div className="cnt-detail-banner">
                <div className="cnt-detail-avatar">
                  {(selectedRow.firstName || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="cnt-detail-name">
                    {selectedRow.titleName && <span className="cnt-title-badge">{selectedRow.titleName}</span>}
                    {' '}{selectedRow.firstName} {selectedRow.lastName}
                  </div>
                  <div className="cnt-detail-sub">{selectedRow.clientName}</div>
                </div>
              </div>

              <div className="cnt-detail-grid">
                <DetailField label="Contact ID"    value={`#${selectedRow.idContact}`} />
                <DetailField label="Email"         value={selectedRow.email}    link={`mailto:${selectedRow.email}`} />
                <DetailField label="Phone"         value={selectedRow.phone} />
                <DetailField label="Date of Birth" value={fmt(selectedRow.dateOfBirth)} />
                <DetailField label="Work Area"     value={selectedRow.wordAreas} />
                <DetailField label="Pref. Channel" value={selectedRow.preferredChannelName} />
                <DetailField label="Employee"      value={selectedRow.employeeName} />
                <DetailField label="City"          value={selectedRow.cityName} />
                <DetailField label="State"         value={selectedRow.stateName} />
                <DetailField label="Address"       value={selectedRow.address} full />
                <DetailField label="Notes"         value={selectedRow.description} full />
                <DetailField label="Created"       value={fmt(selectedRow.creationDate)} />
                <DetailField label="Modified"      value={fmt(selectedRow.modificationDate)} />
              </div>
            </div>
            <div className="cnt-modal-footer">
              <button className="cnt-btn cnt-btn-ghost" onClick={closeModal}>Close</button>
              <button className="cnt-btn cnt-btn-secondary" onClick={() => { closeModal(); openEdit(selectedRow); }}>
                <i className="fas fa-edit me-1" />Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — DELETE CONFIRM
      ══════════════════════════════════════════════════════════════════ */}
      {modalType === 'delete' && selectedRow && (
        <div className="cnt-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="cnt-modal cnt-modal-sm" role="dialog" aria-modal="true">
            <div className="cnt-modal-header cnt-modal-header-danger">
              <h5><i className="fas fa-exclamation-triangle me-2" />Delete Contact</h5>
              <button className="cnt-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="cnt-modal-body cnt-confirm-body">
              <p>Are you sure you want to delete this contact?</p>
              <div className="cnt-confirm-card">
                <strong>{selectedRow.firstName} {selectedRow.lastName}</strong>
                <span>{selectedRow.clientName}</span>
                {selectedRow.email && <span>{selectedRow.email}</span>}
              </div>
              <p className="cnt-confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="cnt-modal-footer">
              <button className="cnt-btn cnt-btn-ghost" onClick={closeModal} disabled={deleting}>Cancel</button>
              <button className="cnt-btn cnt-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting
                  ? <><i className="fas fa-spinner fa-spin me-1" />Deleting...</>
                  : <><i className="fas fa-trash me-1" />Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Small helper component ───────────────────────────────────────────────────
function DetailField({ label, value, link, full }) {
  return (
    <div className={`cnt-detail-field${full ? ' cnt-detail-field-full' : ''}`}>
      <span className="cnt-detail-label">{label}</span>
      <span className="cnt-detail-value">
        {value
          ? (link ? <a href={link}>{value}</a> : value)
          : '—'}
      </span>
    </div>
  );
}
