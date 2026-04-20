// ===================================
// CLIENT REGISTRATION — modal with 3 tabs
// Tab 1: Client data   Tab 2: Contacts   Tab 3: Bank Accounts
// ===================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import clientService        from '../services/clientService';
import contactService       from '../services/contactService';
import clientAccountService from '../services/clientAccountService.js';
import catalogService       from '../services/catalogService';
import '../styles/ClientRegistration.css';

// ── Empty row templates ────────────────────────────────────────────────────────
const emptyClient = {
  name: '', email: '', phone: '', address: '', zipCode: '',
  comments: '', idLocation: '', idState: '', idCity: '',
  idTypeClient: '', idService: '', paymentTerms: '',
  acceptSMS: false, isActive: true,
};

const emptyContact = {
  idTitles: '', firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', wordAreas: '', idEmployee: '', description: '',
  preferredChannel: '', isActive: true,
};

const emptyAccount = { idBank: '', accountNumber: '' };

// Unique key for unsaved rows
let _seq = 0;
const uid = () => `t${++_seq}_${Date.now()}`;

// ── Helpers ────────────────────────────────────────────────────────────────────
const getLabel = (arr, idKey, labelKey, val) => {
  if (!val) return '—';
  const item = arr.find(a => String(a[idKey]) === String(val));
  return item ? item[labelKey] : String(val);
};

// ══════════════════════════════════════════════════════════════════════════════
export default function ClientRegistration({ mode, clientId, onClose, onSaved }) {

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('client');

  // ── Save / message ───────────────────────────────────────────────────────────
  const [saving,       setSaving]       = useState(false);
  const [loadingData,  setLoadingData]  = useState(false);
  const [msg,          setMsg]          = useState({ type: '', text: '' });

  // ── Client form ──────────────────────────────────────────────────────────────
  const [clientForm, setClientForm] = useState(emptyClient);

  // ── Contacts ─────────────────────────────────────────────────────────────────
  // Each row: { _uid, _status: 'new'|'existing'|'modified'|'deleted', idContact, ...fields }
  const [contacts,         setContacts]         = useState([]);
  const [contactForm,      setContactForm]      = useState(emptyContact);
  const [editContactUid,   setEditContactUid]   = useState(null);
  const [contactFormOpen,  setContactFormOpen]  = useState(false);
  const contactFirstRef = useRef(null);

  // ── Accounts ─────────────────────────────────────────────────────────────────
  // Each row: { _uid, _status, idClientAccount, idBank, accountNumber }
  const [accounts,        setAccounts]        = useState([]);
  const [accountForm,     setAccountForm]     = useState(emptyAccount);
  const [editAccountUid,  setEditAccountUid]  = useState(null);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  // ── Catalogs ──────────────────────────────────────────────────────────────────
  const [locations,    setLocations]    = useState([]);
  const [states,       setStates]       = useState([]);
  const [cities,       setCities]       = useState([]);
  const [typeClients,  setTypeClients]  = useState([]);
  const [services,     setServices]     = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [titles,       setTitles]       = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [channels,     setChannels]     = useState([]);
  const [banks,        setBanks]        = useState([]);
  const [catReady,     setCatReady]     = useState(false);

  // Guard to avoid city/service cascade wiping values during initial edit load
  const skipCascadeRef = useRef(false);

  // ── 1. Load all catalogs on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [locR, stR, tcR, ptR, titR, empR, chR, bkR] = await Promise.all([
        clientService.getLocations(),
        clientService.getStates(),
        clientService.getTypeClients(),
        catalogService.getPaymentTerms(),
        catalogService.getTitles(),
        catalogService.getEmployees(),
        catalogService.getPreferredChannels(),
        catalogService.getBanks(),
      ]);
      if (locR.success) setLocations(locR.data);
      if (stR.success)  setStates(stR.data);
      if (tcR.success)  setTypeClients(tcR.data);
      if (ptR.success)  setPaymentTerms(ptR.data);
      if (titR.success) setTitles(titR.data);
      if (empR.success) setEmployees(empR.data);
      if (chR.success)  setChannels(chR.data);
      if (bkR.success)  setBanks(bkR.data);
      setCatReady(true);
    })();
  }, []);

  // ── 2. In edit mode: load client + contacts + accounts once catalogs are ready ──
  useEffect(() => {
    if (mode !== 'edit' || !clientId || !catReady) return;
    (async () => {
      setLoadingData(true);
      skipCascadeRef.current = true; // freeze cascades during load

      const [cliR, conR, accR] = await Promise.all([
        clientService.getById(clientId),
        contactService.getByClient(clientId),
        clientAccountService.getByClient(clientId),
      ]);

      if (cliR.success) {
        const d = cliR.data;
        setClientForm({
          name:         d.name          || '',
          email:        d.email         || '',
          phone:        d.phone         || '',
          address:      d.address       || '',
          zipCode:      d.zipCode       || '',
          comments:     d.comments      || '',
          idLocation:   d.idLocation    || '',
          idState:      d.idState       || '',
          idCity:       d.idCity        || '',
          idTypeClient: d.idTypeClient  || '',
          idService:    d.idService     || '',
          paymentTerms: d.paymentTerms  || '',
          acceptSMS:    d.acceptSMS     || false,
          isActive:     d.state === '1' || d.isActive === true,
        });

        // Pre-load cities and services for the loaded values
        const [ctR, svR] = await Promise.all([
          d.idState      ? clientService.getCitiesByState(d.idState)        : Promise.resolve({ success: false }),
          d.idTypeClient ? clientService.getServicesByType(d.idTypeClient)  : Promise.resolve({ success: false }),
        ]);
        if (ctR.success) setCities(ctR.data);
        if (svR.success) setServices(svR.data);
      }

      if (conR.success) {
        setContacts(conR.data.map(c => ({
          _uid:            uid(),
          _status:         'existing',
          idContact:       c.idContact,
          idTitles:        c.idTitles        || '',
          firstName:       c.firstName       || '',
          lastName:        c.lastName        || '',
          email:           c.email           || '',
          phone:           c.phone           || '',
          dateOfBirth:     c.dateOfBirth     ? c.dateOfBirth.slice(0, 10) : '',
          wordAreas:       c.wordAreas       || '',
          idEmployee:      c.idEmployee      || '',
          description:     c.description     || '',
          preferredChannel: c.preferredChannel || '',
        })));
      }

      if (accR.success) {
        setAccounts(accR.data.map(a => ({
          _uid:            uid(),
          _status:         'existing',
          idClientAccount: a.idClientAccount,
          idBank:          a.idBank          || '',
          accountNumber:   a.accountNumber   || '',
        })));
      }

      setLoadingData(false);
      // Allow cascades again after a tick so the loaded values are stable
      setTimeout(() => { skipCascadeRef.current = false; }, 0);
    })();
  }, [mode, clientId, catReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Cascade: idState → cities ──────────────────────────────────────────────
  const prevState = useRef('');
  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (clientForm.idState === prevState.current) return;
    prevState.current = clientForm.idState;

    if (!clientForm.idState) {
      setCities([]);
      setClientForm(prev => ({ ...prev, idCity: '' }));
      return;
    }
    clientService.getCitiesByState(clientForm.idState).then(r => {
      if (!r.success) return;
      setCities(r.data);
      // Only reset city if current value not in the new list
      setClientForm(prev => {
        const inList = r.data.some(c => String(c.idCity) === String(prev.idCity));
        return inList ? prev : { ...prev, idCity: r.data[0]?.idCity || '' };
      });
    });
  }, [clientForm.idState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Cascade: idTypeClient → services ────────────────────────────────────────
  const prevType = useRef('');
  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (clientForm.idTypeClient === prevType.current) return;
    prevType.current = clientForm.idTypeClient;

    if (!clientForm.idTypeClient) {
      setServices([]);
      setClientForm(prev => ({ ...prev, idService: '' }));
      return;
    }
    clientService.getServicesByType(clientForm.idTypeClient).then(r => {
      if (!r.success) return;
      setServices(r.data);
      setClientForm(prev => {
        const inList = r.data.some(s => String(s.idService) === String(prev.idService));
        return inList ? prev : { ...prev, idService: r.data[0]?.idService || '' };
      });
    });
  }, [clientForm.idTypeClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client form handler ────────────────────────────────────────────────────────
  const handleClientChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setClientForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  // ── Contact form handlers ──────────────────────────────────────────────────────
  const openContactForm = (row = null) => {
    if (row) {
      setEditContactUid(row._uid);
      setContactForm({
        idTitles:        row.idTitles        || '',
        firstName:       row.firstName       || '',
        lastName:        row.lastName        || '',
        email:           row.email           || '',
        phone:           row.phone           || '',
        dateOfBirth:     row.dateOfBirth     || '',
        wordAreas:       row.wordAreas       || '',
        idEmployee:      row.idEmployee      || '',
        description:     row.description     || '',
        preferredChannel: row.preferredChannel || '',
        isActive:        row.isActive !== false,
      });
    } else {
      setEditContactUid(null);
      setContactForm(emptyContact);
    }
    setContactFormOpen(true);
    setTimeout(() => contactFirstRef.current?.focus(), 50);
  };

  const closeContactForm = () => {
    setContactFormOpen(false);
    setEditContactUid(null);
    setContactForm(emptyContact);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const saveContactRow = () => {
    if (!contactForm.firstName.trim()) {
      setMsg({ type: 'error', text: 'El primer nombre del contacto es requerido' });
      return;
    }
    if (editContactUid) {
      setContacts(prev => prev.map(c => c._uid !== editContactUid ? c : {
        ...c, ...contactForm,
        _status: c._status === 'new' ? 'new' : 'modified',
      }));
    } else {
      setContacts(prev => [...prev, {
        _uid: uid(), _status: 'new', idContact: null, ...contactForm,
      }]);
    }
    closeContactForm();
    setMsg({ type: '', text: '' });
  };

  const removeContact = (_uid) => {
    setContacts(prev => prev
      .map(c => c._uid !== _uid ? c : (c._status === 'new' ? null : { ...c, _status: 'deleted' }))
      .filter(Boolean)
    );
    if (editContactUid === _uid) closeContactForm();
  };

  // ── Account form handlers ──────────────────────────────────────────────────────
  const openAccountForm = (row = null) => {
    if (row) {
      setEditAccountUid(row._uid);
      setAccountForm({ idBank: row.idBank || '', accountNumber: row.accountNumber || '' });
    } else {
      setEditAccountUid(null);
      setAccountForm(emptyAccount);
    }
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    setAccountFormOpen(false);
    setEditAccountUid(null);
    setAccountForm(emptyAccount);
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
  };

  const saveAccountRow = () => {
    if (!accountForm.idBank) {
      setMsg({ type: 'error', text: 'El banco es requerido' });
      return;
    }
    if (!accountForm.accountNumber.trim()) {
      setMsg({ type: 'error', text: 'El número de cuenta es requerido' });
      return;
    }
    if (editAccountUid) {
      setAccounts(prev => prev.map(a => a._uid !== editAccountUid ? a : {
        ...a, ...accountForm,
        _status: a._status === 'new' ? 'new' : 'modified',
      }));
    } else {
      setAccounts(prev => [...prev, {
        _uid: uid(), _status: 'new', idClientAccount: null, ...accountForm,
      }]);
    }
    closeAccountForm();
    setMsg({ type: '', text: '' });
  };

  const removeAccount = (_uid) => {
    setAccounts(prev => prev
      .map(a => a._uid !== _uid ? a : (a._status === 'new' ? null : { ...a, _status: 'deleted' }))
      .filter(Boolean)
    );
    if (editAccountUid === _uid) closeAccountForm();
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateClient = () => {
    if (!clientForm.name.trim())    return 'El nombre del cliente es requerido';
    if (!clientForm.address.trim()) return 'La dirección es requerida';
    if (!clientForm.idLocation)     return 'La ubicación es requerida';
    if (!clientForm.idState)        return 'El estado es requerido';
    if (!clientForm.idCity)         return 'La ciudad es requerida';
    if (!clientForm.idTypeClient)   return 'El tipo de cliente es requerido';
    if (!clientForm.idService)      return 'El servicio es requerido';
    if (clientForm.acceptSMS && !clientForm.phone.trim())
      return 'El teléfono es requerido cuando se acepta SMS';
    return null;
  };

  // ── SAVE ALL ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validErr = validateClient();
    if (validErr) {
      setMsg({ type: 'error', text: validErr });
      setActiveTab('client');
      return;
    }

    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      // 1. Save client ──────────────────────────────────────────────────────────
      let targetId = clientId;
      if (mode === 'create') {
        const r = await clientService.create(clientForm);
        if (!r.success) { setMsg({ type: 'error', text: r.message || 'Error al crear cliente' }); return; }
        targetId = r.data;
      } else {
        const r = await clientService.update(clientId, clientForm);
        if (!r.success) { setMsg({ type: 'error', text: r.message || 'Error al actualizar cliente' }); return; }
      }

      // 2. Sync contacts ─────────────────────────────────────────────────────────
      const contactErrors = [];
      for (const c of contacts) {
        if (c._status === 'deleted' && c.idContact) {
          const r = await contactService.delete(c.idContact);
          if (!r.success) contactErrors.push(r.message);
        } else if (c._status === 'new') {
          const r = await contactService.create({ ...c, idClient: targetId });
          if (!r.success) contactErrors.push(r.message);
        } else if (c._status === 'modified' && c.idContact) {
          const r = await contactService.update(c.idContact, { ...c, idClient: targetId });
          if (!r.success) contactErrors.push(r.message);
        }
      }

      // 3. Sync accounts ─────────────────────────────────────────────────────────
      const accountErrors = [];
      for (const a of accounts) {
        if (a._status === 'deleted' && a.idClientAccount) {
          const r = await clientAccountService.delete(a.idClientAccount);
          if (!r.success) accountErrors.push(r.message);
        } else if (a._status === 'new') {
          const r = await clientAccountService.create({ ...a, idClient: targetId });
          if (!r.success) accountErrors.push(r.message);
        } else if (a._status === 'modified' && a.idClientAccount) {
          const r = await clientAccountService.update(a.idClientAccount, { ...a, idClient: targetId });
          if (!r.success) accountErrors.push(r.message);
        }
      }

      const allErrors = [...contactErrors, ...accountErrors];
      if (allErrors.length > 0) {
        setMsg({ type: 'error', text: `Cliente guardado con advertencias: ${allErrors.join(' | ')}` });
        return;
      }

      onSaved();
    } catch (e) {
      setMsg({ type: 'error', text: 'Error inesperado al guardar' });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CLIENT TAB
  // ─────────────────────────────────────────────────────────────────────────────
  const renderClientTab = () => (
    <div className="cr-tab-content">

      {/* ── Section: Información Personal ── */}
      <div className="cr-section"><span>Información Personal</span></div>
      <div className="cr-form-grid">
        <div className="cr-field cr-field-full">
          <label className="cr-label">Nombre del Cliente <span className="cr-required">*</span></label>
          <input type="text" name="name" className="cr-input" value={clientForm.name}
            onChange={handleClientChange} placeholder="ACME Corporation" maxLength={100} autoFocus />
        </div>
        <div className="cr-field">
          <label className="cr-label">Email</label>
          <input type="email" name="email" className="cr-input" value={clientForm.email}
            onChange={handleClientChange} placeholder="correo@dominio.com" maxLength={50} />
        </div>
        <div className="cr-field">
          <label className="cr-label">
            Teléfono {clientForm.acceptSMS && <span className="cr-required">*</span>}
          </label>
          <input type="tel" name="phone" className="cr-input" value={clientForm.phone}
            onChange={handleClientChange} placeholder="(555) 123-4567" maxLength={20} />
        </div>
        <div className="cr-field cr-field-full">
          <label className="cr-label">Dirección <span className="cr-required">*</span></label>
          <input type="text" name="address" className="cr-input" value={clientForm.address}
            onChange={handleClientChange} placeholder="Calle, número, colonia..." maxLength={100} />
        </div>
      </div>

      {/* ── Section: Ubicación ── */}
      <div className="cr-section"><span>Ubicación</span></div>
      <div className="cr-grid-3">
        <div className="cr-field">
          <label className="cr-label">Ubicación <span className="cr-required">*</span></label>
          <select name="idLocation" className="cr-select" value={clientForm.idLocation} onChange={handleClientChange}>
            <option value="">— Seleccione —</option>
            {locations.map(l => <option key={l.idTabla} value={l.idTabla}>{l.description}</option>)}
          </select>
        </div>
        <div className="cr-field">
          <label className="cr-label">Estado <span className="cr-required">*</span></label>
          <select name="idState" className="cr-select" value={clientForm.idState} onChange={handleClientChange}>
            <option value="">— Seleccione —</option>
            {states.map(s => <option key={s.idState} value={s.idState}>{s.nameState}</option>)}
          </select>
        </div>
        <div className="cr-field">
          <label className="cr-label">Ciudad <span className="cr-required">*</span></label>
          <select name="idCity" className="cr-select" value={clientForm.idCity}
            onChange={handleClientChange} disabled={!clientForm.idState}>
            <option value="">— Seleccione —</option>
            {cities.map(c => <option key={c.idCity} value={c.idCity}>{c.nombreCity}</option>)}
          </select>
          {!clientForm.idState && <small className="cr-help">Selecciona primero un estado</small>}
        </div>
      </div>
      <div className="cr-form-grid" style={{ marginTop: 12 }}>
        <div className="cr-field">
          <label className="cr-label">Código Postal</label>
          <input type="text" name="zipCode" className="cr-input" value={clientForm.zipCode}
            onChange={handleClientChange} placeholder="12345" maxLength={10} />
        </div>
        <div className="cr-field">
          <label className="cr-label">Términos de Pago</label>
          <select name="paymentTerms" className="cr-select" value={clientForm.paymentTerms} onChange={handleClientChange}>
            <option value="">— Seleccione —</option>
            {paymentTerms.map(p => (
              <option key={p.idPaymentTerms} value={p.paymentTermsName}>{p.paymentTermsName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Section: Servicio ── */}
      <div className="cr-section"><span>Servicio</span></div>
      <div className="cr-form-grid">
        <div className="cr-field">
          <label className="cr-label">Tipo de Cliente <span className="cr-required">*</span></label>
          <select name="idTypeClient" className="cr-select" value={clientForm.idTypeClient} onChange={handleClientChange}>
            <option value="">— Seleccione —</option>
            {typeClients.map(t => <option key={t.idTypeClient} value={t.idTypeClient}>{t.name}</option>)}
          </select>
        </div>
        <div className="cr-field">
          <label className="cr-label">Servicio <span className="cr-required">*</span></label>
          <select name="idService" className="cr-select" value={clientForm.idService}
            onChange={handleClientChange} disabled={!clientForm.idTypeClient}>
            <option value="">— Seleccione —</option>
            {services.map(s => (
              <option key={s.idService} value={s.idService}>
                {s.name}{s.price > 0 ? ` ($${s.price})` : ''}
              </option>
            ))}
          </select>
          {!clientForm.idTypeClient && <small className="cr-help">Selecciona primero un tipo de cliente</small>}
        </div>
        <div className="cr-field cr-field-full">
          <label className="cr-label">Comentarios</label>
          <textarea name="comments" className="cr-input" value={clientForm.comments}
            onChange={handleClientChange} rows={3} maxLength={500}
            placeholder="Notas adicionales sobre el cliente..." />
        </div>
      </div>

      {/* ── Section: Configuración y Consentimiento ── */}
      <div className="cr-section"><span>Configuración y Consentimiento</span></div>
      <div className="cr-consent-block">
        <label className="cr-checkbox-label">
          <input type="checkbox" name="isActive" className="cr-checkbox"
            checked={clientForm.isActive} onChange={handleClientChange} />
          <span>Cliente Activo</span>
        </label>
        <label className="cr-checkbox-label" style={{ marginTop: 10 }}>
          <input type="checkbox" name="acceptSMS" className="cr-checkbox"
            checked={clientForm.acceptSMS} onChange={handleClientChange} />
          <span>Consentimiento de SMS otorgado</span>
        </label>
        {clientForm.acceptSMS && (
          <div className="cr-sms-notice">
            <i className="fas fa-info-circle" style={{ marginRight: 6 }} />
            Al marcar esta opción, el cliente acepta recibir mensajes de texto (SMS) con información
            sobre servicios, recordatorios y promociones. El cliente puede revocar este consentimiento
            en cualquier momento comunicándose con nosotros.
          </div>
        )}
      </div>

    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CONTACTS TAB
  // ─────────────────────────────────────────────────────────────────────────────
  const visibleContacts = contacts.filter(c => c._status !== 'deleted');

  const renderContactsTab = () => (
    <div className="cr-tab-content">
      <div className="cr-section-header">
        <span className="cr-section-title">
          Contactos <span className="cr-count">{visibleContacts.length}</span>
        </span>
        <button type="button" className="cr-btn cr-btn-outline" onClick={() => openContactForm()}>
          <i className="fas fa-plus" /> Agregar Contacto
        </button>
      </div>

      {visibleContacts.length === 0 && !contactFormOpen && (
        <div className="cr-empty">
          <i className="fas fa-user-tie" />
          <p>No hay contactos registrados</p>
          <p className="cr-empty-hint">Los contactos son opcionales. Puedes agregarlos ahora o después de guardar el cliente.</p>
        </div>
      )}

      {visibleContacts.length > 0 && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Canal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleContacts.map(c => (
                <tr key={c._uid} className={editContactUid === c._uid ? 'cr-row-editing' : ''}>
                  <td>
                    {c.idTitles && (
                      <span className="cr-tag">
                        {getLabel(titles, 'idTitle', 'titleName', c.idTitles)}
                      </span>
                    )}
                    {' '}{c.firstName} {c.lastName}
                    {c._status === 'new'      && <span className="cr-badge-new">Nuevo</span>}
                    {c._status === 'modified' && <span className="cr-badge-mod">Modificado</span>}
                  </td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.preferredChannel
                    ? getLabel(channels, 'idPreferredChannel', 'preferredChannelName', c.preferredChannel)
                    : '—'}
                  </td>
                  <td>
                    <div className="cr-row-actions">
                      <button type="button" className="cr-icon-btn cr-icon-btn-edit"
                        onClick={() => openContactForm(c)} title="Editar">
                        <i className="fas fa-edit" />
                      </button>
                      <button type="button" className="cr-icon-btn cr-icon-btn-del"
                        onClick={() => removeContact(c._uid)} title="Eliminar">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline contact form */}
      {contactFormOpen && (
        <div className="cr-inline-form">
          <div className="cr-inline-form-header">
            <span>{editContactUid ? 'Editar Contacto' : 'Nuevo Contacto'}</span>
            <button type="button" className="cr-icon-btn" onClick={closeContactForm}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="cr-form-grid">
            {/* Row 1: First Name + Last Name */}
            <div className="cr-field">
              <label className="cr-label">Nombre <span className="cr-required">*</span></label>
              <input ref={contactFirstRef} type="text" name="firstName" className="cr-input"
                value={contactForm.firstName} onChange={handleContactChange}
                placeholder="Nombre" maxLength={50} />
            </div>
            <div className="cr-field">
              <label className="cr-label">Apellido</label>
              <input type="text" name="lastName" className="cr-input"
                value={contactForm.lastName} onChange={handleContactChange}
                placeholder="Apellido" maxLength={50} />
            </div>
            {/* Row 2: Email (full) */}
            <div className="cr-field cr-field-full">
              <label className="cr-label">Email</label>
              <input type="email" name="email" className="cr-input"
                value={contactForm.email} onChange={handleContactChange}
                placeholder="correo@ejemplo.com" maxLength={50} />
            </div>
            {/* Row 3: Phone + Date of Birth */}
            <div className="cr-field">
              <label className="cr-label">Teléfono <span className="cr-required">*</span></label>
              <input type="tel" name="phone" className="cr-input"
                value={contactForm.phone} onChange={handleContactChange}
                placeholder="(555) 123-4567" maxLength={20} />
            </div>
            <div className="cr-field">
              <label className="cr-label">Fecha de Nacimiento</label>
              <input type="date" name="dateOfBirth" className="cr-input"
                value={contactForm.dateOfBirth} onChange={handleContactChange} />
            </div>
            {/* Row 4: Title Contact */}
            <div className="cr-field">
              <label className="cr-label">Título del Contacto</label>
              <select name="idTitles" className="cr-select"
                value={contactForm.idTitles} onChange={handleContactChange}>
                <option value="">— Seleccione —</option>
                {titles.map(t => <option key={t.idTitle} value={t.idTitle}>{t.titleName}</option>)}
              </select>
            </div>
            <div className="cr-field">
              <label className="cr-label">Canal Preferido</label>
              <select name="preferredChannel" className="cr-select"
                value={contactForm.preferredChannel} onChange={handleContactChange}>
                <option value="">— Seleccione —</option>
                {channels.map(c => (
                  <option key={c.idPreferredChannel} value={c.idPreferredChannel}>
                    {c.preferredChannelName}
                  </option>
                ))}
              </select>
            </div>
            {/* Row 5: Work Area + Assigned To */}
            <div className="cr-field">
              <label className="cr-label">Área de Trabajo</label>
              <input type="text" name="wordAreas" className="cr-input"
                value={contactForm.wordAreas} onChange={handleContactChange}
                placeholder="Ej: Finanzas, Ventas" maxLength={100} />
            </div>
            <div className="cr-field">
              <label className="cr-label">Empleado Asignado</label>
              <select name="idEmployee" className="cr-select"
                value={contactForm.idEmployee} onChange={handleContactChange}>
                <option value="">— Seleccione —</option>
                {employees.map(e => (
                  <option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>
                ))}
              </select>
            </div>
            {/* Active checkbox */}
            <div className="cr-field cr-field-full">
              <label className="cr-checkbox-label">
                <input type="checkbox" name="isActive" className="cr-checkbox"
                  checked={contactForm.isActive}
                  onChange={e => setContactForm(prev => ({ ...prev, isActive: e.target.checked }))} />
                <span>Contacto Activo</span>
              </label>
            </div>
            {/* Description (full) */}
            <div className="cr-field cr-field-full">
              <label className="cr-label">Descripción</label>
              <textarea name="description" className="cr-input"
                value={contactForm.description} onChange={handleContactChange}
                rows={2} maxLength={300} placeholder="Notas sobre el contacto..." />
            </div>
          </div>
          <div className="cr-inline-form-footer">
            <button type="button" className="cr-btn cr-btn-ghost" onClick={closeContactForm}>
              Cancelar
            </button>
            <button type="button" className="cr-btn cr-btn-primary" onClick={saveContactRow}>
              <i className="fas fa-check" />
              {editContactUid ? ' Actualizar' : ' Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: ACCOUNTS TAB
  // ─────────────────────────────────────────────────────────────────────────────
  const visibleAccounts = accounts.filter(a => a._status !== 'deleted');

  const renderAccountsTab = () => (
    <div className="cr-tab-content">
      <div className="cr-section-header">
        <span className="cr-section-title">
          Cuentas Bancarias <span className="cr-count">{visibleAccounts.length}</span>
        </span>
        <button type="button" className="cr-btn cr-btn-outline" onClick={() => openAccountForm()}>
          <i className="fas fa-plus" /> Agregar Cuenta
        </button>
      </div>

      {visibleAccounts.length === 0 && !accountFormOpen && (
        <div className="cr-empty">
          <i className="fas fa-university" />
          <p>No hay cuentas bancarias registradas</p>
          <p className="cr-empty-hint">Las cuentas son opcionales.</p>
        </div>
      )}

      {visibleAccounts.length > 0 && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr><th>Banco</th><th>Número de Cuenta</th><th></th></tr>
            </thead>
            <tbody>
              {visibleAccounts.map(a => (
                <tr key={a._uid} className={editAccountUid === a._uid ? 'cr-row-editing' : ''}>
                  <td>
                    {getLabel(banks, 'idBank', 'bankName', a.idBank)}
                    {a._status === 'new'      && <span className="cr-badge-new">Nuevo</span>}
                    {a._status === 'modified' && <span className="cr-badge-mod">Modificado</span>}
                  </td>
                  <td><code className="cr-account-num">{a.accountNumber}</code></td>
                  <td>
                    <div className="cr-row-actions">
                      <button type="button" className="cr-icon-btn cr-icon-btn-edit"
                        onClick={() => openAccountForm(a)} title="Editar">
                        <i className="fas fa-edit" />
                      </button>
                      <button type="button" className="cr-icon-btn cr-icon-btn-del"
                        onClick={() => removeAccount(a._uid)} title="Eliminar">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accountFormOpen && (
        <div className="cr-inline-form">
          <div className="cr-inline-form-header">
            <span>{editAccountUid ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}</span>
            <button type="button" className="cr-icon-btn" onClick={closeAccountForm}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="cr-form-grid">
            <div className="cr-field">
              <label className="cr-label">Banco <span className="cr-required">*</span></label>
              <select name="idBank" className="cr-select"
                value={accountForm.idBank} onChange={handleAccountChange} autoFocus>
                <option value="">— Seleccione —</option>
                {banks.map(b => <option key={b.idBank} value={b.idBank}>{b.bankName}</option>)}
              </select>
            </div>
            <div className="cr-field">
              <label className="cr-label">Número de Cuenta <span className="cr-required">*</span></label>
              <input type="text" name="accountNumber" className="cr-input"
                value={accountForm.accountNumber} onChange={handleAccountChange}
                placeholder="000-000-000" maxLength={50} />
            </div>
          </div>
          <div className="cr-inline-form-footer">
            <button type="button" className="cr-btn cr-btn-ghost" onClick={closeAccountForm}>
              Cancelar
            </button>
            <button type="button" className="cr-btn cr-btn-primary" onClick={saveAccountRow}>
              <i className="fas fa-check" />
              {editAccountUid ? ' Actualizar' : ' Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'client',   label: 'Cliente',          icon: 'fas fa-user' },
    { id: 'contacts', label: 'Contactos',         icon: 'fas fa-user-tie', count: visibleContacts.length },
    { id: 'accounts', label: 'Cuentas Bancarias', icon: 'fas fa-university', count: visibleAccounts.length },
  ];

  return (
    <div className="cr-overlay" onClick={onClose}>
      <div className="cr-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="cr-header">
          <div className="cr-header-left">
            <div className="cr-header-icon">
              <i className={`fas fa-${mode === 'create' ? 'user-plus' : 'user-edit'}`} />
            </div>
            <div>
              <h5 className="cr-header-title">
                {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h5>
              <p className="cr-header-sub">
                {mode === 'create'
                  ? 'Completa los datos, agrega contactos y cuentas bancarias'
                  : 'Actualiza la información del cliente'}
              </p>
            </div>
          </div>
          <button type="button" className="cr-close-btn" onClick={onClose} disabled={saving}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="cr-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`cr-tab${activeTab === t.id ? ' cr-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={t.icon} />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="cr-tab-badge">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Alert ── */}
        {msg.text && (
          <div className={`cr-alert cr-alert-${msg.type}`}>
            <span>{msg.text}</span>
            <button type="button" className="cr-alert-close"
              onClick={() => setMsg({ type: '', text: '' })}>×</button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="cr-body">
          {loadingData
            ? (
              <div className="cr-loading">
                <div className="cr-spinner" />
                <span>Cargando datos...</span>
              </div>
            ) : (
              <>
                {activeTab === 'client'   && renderClientTab()}
                {activeTab === 'contacts' && renderContactsTab()}
                {activeTab === 'accounts' && renderAccountsTab()}
              </>
            )
          }
        </div>

        {/* ── Footer ── */}
        <div className="cr-footer">
          <button type="button" className="cr-btn cr-btn-ghost"
            onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="cr-btn cr-btn-primary"
            onClick={handleSave} disabled={saving || loadingData}>
            {saving
              ? <><div className="cr-spinner-sm" /> Guardando...</>
              : <><i className="fas fa-save" /> Guardar Todo</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
