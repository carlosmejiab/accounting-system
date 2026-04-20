// ===================================
// COMPONENTE: CLIENT ACCOUNT
// ===================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import clientAccountService from '../services/clientAccountService';
import clientService from '../services/clientService';
import '../styles/ClientAccount.css';

const EMPTY_FORM = {
  idClient:      '',
  clientName:    '',
  idBank:        '',
  accountNumber: '',
  isActive:      true,
};

function ClientAccount() {
  // ── List state ────────────────────────────────────────────────────────────
  const [accounts,     setAccounts]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');

  // ── Catalogs ──────────────────────────────────────────────────────────────
  const [banks,        setBanks]        = useState([]);
  const [clients,      setClients]      = useState([]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalMode,    setModalMode]    = useState('create'); // 'create' | 'edit' | 'delete'
  const [editingId,    setEditingId]    = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [formMsg,      setFormMsg]      = useState({ type: '', text: '' });
  const [saving,       setSaving]       = useState(false);

  // ── Client search modal ───────────────────────────────────────────────────
  const [clientSearch,       setClientSearch]       = useState(false);
  const [clientSearchTerm,   setClientSearchTerm]   = useState('');
  const [clientSearchList,   setClientSearchList]   = useState([]);
  const [clientSearchLoading,setClientSearchLoading]= useState(false);

  const searchRef = useRef(null);

  // ── Load list + catalogs ─────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const res = await clientAccountService.getAll();
    if (res.success) setAccounts(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAccounts();
    clientAccountService.getBanks().then(r => { if (r.success) setBanks(r.data); });
  }, [loadAccounts]);

  // ── Client search ─────────────────────────────────────────────────────────
  const openClientSearch = async () => {
    setClientSearch(true);
    setClientSearchTerm('');
    setClientSearchLoading(true);
    const res = await clientService.getAll?.() || { success: false, data: [] };
    setClientSearchList(res.success ? res.data : []);
    setClientSearchLoading(false);
  };

  const filteredClients = clients.length > 0
    ? clients.filter(c =>
        c.name?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      )
    : clientSearchList.filter(c =>
        c.name?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      );

  const selectClient = (c) => {
    setFormData(prev => ({
      ...prev,
      idClient:   c.idClient || c.id || c.IdClient || '',
      clientName: c.name     || c.Name || '',
    }));
    setClientSearch(false);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormMsg({ type: '', text: '' });
    setEditingId(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setFormData({
      idClient:      row.idClient      || '',
      clientName:    row.clientName    || '',
      idBank:        row.idBank        || '',
      accountNumber: row.accountNumber || '',
      isActive:      row.state === '1' || row.state === 1,
    });
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idClientAccount);
    setModalMode('edit');
    setModalOpen(true);
  };

  const openDelete = (row) => {
    setFormData({
      idClient:      row.idClient      || '',
      clientName:    row.clientName    || '',
      idBank:        row.idBank        || '',
      accountNumber: row.accountNumber || '',
      isActive:      row.state === '1' || row.state === 1,
    });
    setFormMsg({ type: '', text: '' });
    setEditingId(row.idClientAccount);
    setModalMode('delete');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setClientSearch(false);
  };

  // ── Save / Delete ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.idClient) {
      setFormMsg({ type: 'error', text: 'Client is required.' });
      return;
    }
    if (!formData.accountNumber.trim()) {
      setFormMsg({ type: 'error', text: 'Account Number is required.' });
      return;
    }

    setSaving(true);
    setFormMsg({ type: '', text: '' });

    let res;
    if (modalMode === 'create') {
      res = await clientAccountService.create(formData);
    } else if (modalMode === 'edit') {
      res = await clientAccountService.update(editingId, formData);
    } else {
      res = await clientAccountService.delete(editingId);
    }

    if (res.success) {
      setModalOpen(false);
      await loadAccounts();
    } else {
      setFormMsg({ type: 'error', text: res.message });
    }
    setSaving(false);
  };

  // ── Filter list ────────────────────────────────────────────────────────────
  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.clientName    || '').toLowerCase().includes(q) ||
      (a.bankName      || '').toLowerCase().includes(q) ||
      (a.accountNumber || '').toLowerCase().includes(q)
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ca-container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="ca-header">
        <h2 className="ca-title">
          <i className="fas fa-university" /> Client Account
        </h2>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="ca-toolbar">
        <input
          ref={searchRef}
          className="ca-search"
          type="text"
          placeholder="Search by client, bank or account number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="ca-btn ca-btn-primary" onClick={openCreate}>
          <i className="fas fa-plus" /> Add Client Account
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {loading
        ? <div className="ca-loading"><div className="ca-spinner" /></div>
        : (
          <div className="ca-table-wrap">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>Name Client</th>
                  <th>Bank</th>
                  <th>Account Number</th>
                  <th className="ca-th-center">Status</th>
                  <th className="ca-th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="ca-empty">
                        {search ? 'No results found.' : 'No client accounts registered.'}
                      </td>
                    </tr>
                  )
                  : filtered.map(row => (
                    <tr key={row.idClientAccount}
                        className={row.state === '0' || row.state === 0 ? 'ca-row-inactive' : ''}>
                      <td>{row.clientName || '—'}</td>
                      <td>{row.bankName   || '—'}</td>
                      <td>{row.accountNumber}</td>
                      <td className="ca-td-center">
                        <span className={`ca-badge ${row.state === '1' || row.state === 1 ? 'ca-badge-active' : 'ca-badge-inactive'}`}>
                          {row.state === '1' || row.state === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="ca-td-center ca-td-actions">
                        <button className="ca-action-btn ca-action-edit"
                          title="Edit" onClick={() => openEdit(row)}>
                          <i className="fas fa-pencil-alt" />
                        </button>
                        <button className="ca-action-btn ca-action-delete"
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

      {/* ── Form Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="ca-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="ca-modal">

            <div className="ca-modal-header">
              <h5>
                {modalMode === 'create' && 'Do you want to save the information?'}
                {modalMode === 'edit'   && 'Do you want to update the information?'}
                {modalMode === 'delete' && 'Do you want to delete the information?'}
              </h5>
              <button className="ca-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="ca-modal-body">
              <h6 className="ca-form-section-title">Client Account</h6>

              {formMsg.text && (
                <div className={`ca-alert ca-alert-${formMsg.type}`}>{formMsg.text}</div>
              )}

              <div className="ca-form-grid">

                {/* Client */}
                <div className="ca-field">
                  <label className="ca-label">Client <span className="ca-required">*</span></label>
                  <div className="ca-input-group">
                    <input className="ca-input" type="text" readOnly
                      value={formData.clientName}
                      placeholder="Select a client..."
                      disabled={modalMode === 'delete'} />
                    {modalMode !== 'delete' && (
                      <button className="ca-input-btn ca-input-btn-search"
                        type="button" title="Search client"
                        onClick={openClientSearch}>
                        <i className="fas fa-search" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bank */}
                <div className="ca-field">
                  <label className="ca-label">Bank</label>
                  <select className="ca-select"
                    value={formData.idBank}
                    disabled={modalMode === 'delete'}
                    onChange={e => setFormData(p => ({ ...p, idBank: e.target.value }))}>
                    <option value="">— Select —</option>
                    {banks.map(b => (
                      <option key={b.idTabla} value={b.idTabla}>{b.description}</option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div className="ca-field">
                  <label className="ca-label">Account Number <span className="ca-required">*</span></label>
                  <input className="ca-input" type="text" maxLength={100}
                    value={formData.accountNumber}
                    disabled={modalMode === 'delete'}
                    onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} />
                </div>

                {/* State */}
                <div className="ca-field ca-field-checkbox">
                  <label className="ca-label">
                    State&nbsp;
                    <input type="checkbox"
                      checked={formData.isActive}
                      disabled={modalMode === 'delete'}
                      onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} />
                  </label>
                </div>

              </div>
            </div>

            <div className="ca-modal-footer">
              <button className="ca-btn ca-btn-secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              {modalMode === 'create' && (
                <button className="ca-btn ca-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Yes, save'}
                </button>
              )}
              {modalMode === 'edit' && (
                <button className="ca-btn ca-btn-warning" onClick={handleSave} disabled={saving}>
                  {saving ? 'Updating...' : 'Yes, update'}
                </button>
              )}
              {modalMode === 'delete' && (
                <button className="ca-btn ca-btn-danger" onClick={handleSave} disabled={saving}>
                  {saving ? 'Deleting...' : 'Yes, delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Client Search Modal ─────────────────────────────────────────── */}
      {clientSearch && (
        <div className="ca-overlay ca-overlay-front">
          <div className="ca-modal ca-modal-lg">
            <div className="ca-modal-header">
              <h5><i className="fas fa-search" /> Search Client</h5>
              <button className="ca-modal-close" onClick={() => setClientSearch(false)}>&times;</button>
            </div>
            <div className="ca-modal-body">
              <input className="ca-search ca-search-full" type="text"
                placeholder="Search by name or email..."
                value={clientSearchTerm}
                autoFocus
                onChange={e => setClientSearchTerm(e.target.value)} />
              {clientSearchLoading
                ? <div className="ca-loading"><div className="ca-spinner" /></div>
                : (
                  <div className="ca-table-wrap ca-table-wrap-modal">
                    <table className="ca-table">
                      <thead>
                        <tr>
                          <th>Client Name</th><th>Email</th>
                          <th>Type</th><th>Location</th>
                          <th>Phone</th><th>City</th>
                          <th className="ca-th-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.length === 0
                          ? <tr><td colSpan={7} className="ca-empty">No clients found.</td></tr>
                          : filteredClients.map(c => (
                            <tr key={c.idClient || c.id}>
                              <td>{c.name || c.Name}</td>
                              <td>{c.email || '—'}</td>
                              <td>{c.typeClient || c.clientType || '—'}</td>
                              <td>{c.location || '—'}</td>
                              <td>{c.phone || '—'}</td>
                              <td>{c.city || c.nombreCity || '—'}</td>
                              <td className="ca-td-center">
                                <button className="ca-action-btn ca-action-select"
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

export default ClientAccount;
