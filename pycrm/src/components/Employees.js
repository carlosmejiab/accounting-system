// ===================================
// COMPONENTE: EMPLOYEES
// ===================================

import React, { useState, useEffect, useCallback } from 'react';
import employeeService from '../services/employeeService';
import '../styles/Employees.css';

const EMPTY_FORM = {
  firstName:  '',
  lastName:   '',
  email:      '',
  mobilePhone:'',
  idLocation: '',
  idPosition: '',
  isActive:   true,
};

export default function Employees() {

  // ── Data ──────────────────────────────────────────────────
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');

  // ── Catalogs ──────────────────────────────────────────────
  const [locationCat,  setLocationCat]  = useState([]);
  const [positionCat,  setPositionCat]  = useState([]);

  // ── Modal ─────────────────────────────────────────────────
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('create');
  const [editingId,  setEditingId]  = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [formMsg,    setFormMsg]    = useState({ type: '', text: '' });
  const [saving,     setSaving]     = useState(false);

  // ── Load ──────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const res = await employeeService.getAll();
    if (res.success) setEmployees(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
    employeeService.getCatalog('Location').then(r        => { if (r.success) setLocationCat(r.data); });
    employeeService.getCatalog('PositionEmployee').then(r => { if (r.success) setPositionCat(r.data); });
  }, [loadEmployees]);

  // ── Helpers ───────────────────────────────────────────────
  const initials = (row) => {
    const f = (row.firstName || '').charAt(0).toUpperCase();
    const l = (row.lastName  || '').charAt(0).toUpperCase();
    return f + l || '?';
  };

  const buildForm = (row) => ({
    firstName:   row.firstName   || '',
    lastName:    row.lastName    || '',
    email:       row.email       || '',
    mobilePhone: row.mobilePhone || '',
    idLocation:  row.idLocation  || '',
    idPosition:  row.idPosition  || '',
    isActive:    row.state === '1' || row.state == null,
  });

  // ── Modal handlers ────────────────────────────────────────
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormMsg({ type: '', text: '' });
    setEditingId(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setFormData(buildForm(row));
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idEmployee);
    setModalMode('edit');
    setModalOpen(true);
  };

  const openDelete = (row) => {
    setFormData(buildForm(row));
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idEmployee);
    setModalMode('delete');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (modalMode === 'delete') {
      setSaving(true);
      const res = await employeeService.delete(editingId);
      if (res.success) { setModalOpen(false); await loadEmployees(); }
      else setFormMsg({ type: 'error', text: res.message });
      setSaving(false);
      return;
    }

    if (!formData.firstName.trim()) { setFormMsg({ type: 'error', text: 'First Name is required.' }); return; }
    if (!formData.lastName.trim())  { setFormMsg({ type: 'error', text: 'Last Name is required.' });  return; }

    setSaving(true);
    setFormMsg({ type: '', text: '' });

    const payload = {
      firstName:   formData.firstName.trim(),
      lastName:    formData.lastName.trim(),
      email:       formData.email       || null,
      mobilePhone: formData.mobilePhone || null,
      idLocation:  formData.idLocation  ? parseInt(formData.idLocation,  10) : null,
      idPosition:  formData.idPosition  ? parseInt(formData.idPosition,  10) : null,
      isActive:    formData.isActive,
    };

    const res = modalMode === 'create'
      ? await employeeService.create(payload)
      : await employeeService.update(editingId, payload);

    if (res.success) { setModalOpen(false); await loadEmployees(); }
    else setFormMsg({ type: 'error', text: res.message });
    setSaving(false);
  };

  // ── Filter ────────────────────────────────────────────────
  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.fullName     || '').toLowerCase().includes(q) ||
      (e.email        || '').toLowerCase().includes(q) ||
      (e.locationName || '').toLowerCase().includes(q) ||
      (e.positionName || '').toLowerCase().includes(q)
    );
  });

  const readOnly = modalMode === 'delete';

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="emp-container">

      {/* Header */}
      <div className="emp-header">
        <h2 className="emp-title">
          <i className="fas fa-user-tie" /> Employees
        </h2>
      </div>

      {/* Toolbar */}
      <div className="emp-toolbar">
        <input
          className="emp-search"
          type="text"
          placeholder="Search by name, email, location or position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="emp-btn emp-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus" /> Add Employee
        </button>
      </div>

      {/* Table */}
      {loading
        ? <div className="emp-loading"><div className="emp-spinner" /></div>
        : (
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th className="emp-th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="emp-empty">
                      {search ? 'No results found.' : 'No employees registered.'}
                    </td></tr>
                  : filtered.map(row => (
                    <tr key={row.idEmployee}>
                      <td>
                        <div className="emp-name-cell">
                          <div className="emp-avatar">{initials(row)}</div>
                          {row.fullName || `${row.firstName} ${row.lastName}`}
                        </div>
                      </td>
                      <td>{row.email       || '—'}</td>
                      <td>{row.mobilePhone || '—'}</td>
                      <td>{row.locationName || '—'}</td>
                      <td>{row.positionName || '—'}</td>
                      <td>
                        <span className={`emp-badge ${row.state === '1' ? 'emp-badge-active' : 'emp-badge-inactive'}`}>
                          {row.state === '1' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="emp-td-actions">
                        <button className="emp-action-btn emp-action-edit"
                          title="Edit" onClick={() => openEdit(row)}>
                          <i className="fas fa-pencil-alt" />
                        </button>
                        <button className="emp-action-btn emp-action-delete"
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
      }

      {/* Modal */}
      {modalOpen && (
        <div className="emp-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="emp-modal">

            <div className="emp-modal-header">
              <h5>
                {modalMode === 'create' && 'New Employee'}
                {modalMode === 'edit'   && 'Edit Employee'}
                {modalMode === 'delete' && 'Delete Employee'}
              </h5>
              <button className="emp-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="emp-modal-body">

              {formMsg.text && (
                <div className={`emp-alert emp-alert-${formMsg.type}`}>{formMsg.text}</div>
              )}

              {/* DELETE confirmation */}
              {modalMode === 'delete' ? (
                <div className="emp-delete-info">
                  <p>Are you sure you want to deactivate this employee?</p>
                  <p><strong>{formData.firstName} {formData.lastName}</strong></p>
                  {formData.email && <p>{formData.email}</p>}
                </div>
              ) : (
                /* CREATE / EDIT form */
                <div className="emp-form-grid">

                  <div className="emp-field">
                    <label className="emp-label">First Name <span className="emp-required">*</span></label>
                    <input className="emp-input" name="firstName"
                      value={formData.firstName} onChange={handleChange}
                      disabled={readOnly} maxLength={50} />
                  </div>

                  <div className="emp-field">
                    <label className="emp-label">Last Name <span className="emp-required">*</span></label>
                    <input className="emp-input" name="lastName"
                      value={formData.lastName} onChange={handleChange}
                      disabled={readOnly} maxLength={50} />
                  </div>

                  <div className="emp-field">
                    <label className="emp-label">Email</label>
                    <input className="emp-input" type="email" name="email"
                      value={formData.email} onChange={handleChange}
                      disabled={readOnly} maxLength={50} />
                  </div>

                  <div className="emp-field">
                    <label className="emp-label">Mobile Phone</label>
                    <input className="emp-input" name="mobilePhone"
                      value={formData.mobilePhone} onChange={handleChange}
                      disabled={readOnly} maxLength={20} />
                  </div>

                  <div className="emp-field">
                    <label className="emp-label">Location</label>
                    <select className="emp-select" name="idLocation"
                      value={formData.idLocation} onChange={handleChange}
                      disabled={readOnly}>
                      <option value="">— Select location —</option>
                      {locationCat.map(c => (
                        <option key={c.idTabla} value={c.idTabla}>{c.description}</option>
                      ))}
                    </select>
                  </div>

                  <div className="emp-field">
                    <label className="emp-label">Position</label>
                    <select className="emp-select" name="idPosition"
                      value={formData.idPosition} onChange={handleChange}
                      disabled={readOnly}>
                      <option value="">— Select position —</option>
                      {positionCat.map(c => (
                        <option key={c.idTabla} value={c.idTabla}>{c.description}</option>
                      ))}
                    </select>
                  </div>

                  {modalMode === 'edit' && (
                    <div className="emp-field emp-field-checkbox">
                      <input type="checkbox" id="empActive" name="isActive"
                        checked={formData.isActive} onChange={handleChange} />
                      <label htmlFor="empActive" className="emp-label" style={{ marginBottom: 0 }}>
                        Active
                      </label>
                    </div>
                  )}

                </div>
              )}
            </div>

            <div className="emp-modal-footer">
              <button className="emp-btn emp-btn-secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button
                className={`emp-btn ${modalMode === 'delete' ? 'emp-btn-danger' : 'emp-btn-primary'}`}
                onClick={handleSave}
                disabled={saving}>
                {saving
                  ? <><i className="fas fa-spinner fa-spin" /> Saving...</>
                  : modalMode === 'delete' ? 'Deactivate' : 'Save'
                }
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
