// ===================================
// COMPONENTE: CLIENTS
// ===================================

import React, { useState, useEffect, useCallback } from 'react';
import clientService from '../services/clientService';
import ClientRegistration from './ClientRegistration';
import '../styles/Clients.css';

function Clients() {

  // ── List state ───────────────────────────────────────────────────────────────
  const [clients,     setClients]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [searchTerm,  setSearchTerm]  = useState('');

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showRegistration, setShowRegistration] = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [selectedClient,   setSelectedClient]   = useState(null);
  const [formMode,         setFormMode]         = useState('create'); // 'create' | 'edit'

  // ── Load clients ─────────────────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await clientService.getAll();
      if (result.success) {
        setClients(result.data || []);
      } else {
        setError(result.message || 'Error al cargar clientes');
      }
    } catch (err) {
      setError(`Error al cargar clientes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  // Auto-clear alerts
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Modal handlers ────────────────────────────────────────────────────────────
  const handleOpenCreate = (e) => {
    if (e) e.preventDefault();
    setFormMode('create');
    setSelectedClient(null);
    setShowRegistration(true);
  };

  const handleOpenEdit = (client, e) => {
    if (e) e.preventDefault();
    setFormMode('edit');
    setSelectedClient(client);
    setShowRegistration(true);
  };

  const handleOpenDetail = async (client, e) => {
    if (e) e.preventDefault();
    const result = await clientService.getById(client.idClient);
    if (result.success) {
      setSelectedClient(result.data);
      setShowDetailModal(true);
    }
  };

  const handleOpenDelete = (client, e) => {
    if (e) e.preventDefault();
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleRegistrationSaved = () => {
    setShowRegistration(false);
    setSelectedClient(null);
    setSuccess(formMode === 'create' ? 'Cliente creado exitosamente' : 'Cliente actualizado exitosamente');
    loadClients();
  };

  const handleRegistrationClose = () => {
    setShowRegistration(false);
    setSelectedClient(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const result = await clientService.delete(selectedClient.idClient);
      if (result.success) {
        setSuccess(result.message || 'Cliente eliminado');
        setShowDeleteModal(false);
        setSelectedClient(null);
        loadClients();
      } else {
        setError(result.message || 'No se pudo eliminar');
      }
    } catch (err) {
      setError(`Error al eliminar cliente: ${err.message}`);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filteredClients = clients.filter(client =>
    (client.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.address?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── Render table ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner" role="status" aria-label="Cargando clientes"></div>
          <p>Cargando clientes...</p>
        </div>
      );
    }

    if (filteredClients.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-users" aria-hidden="true"></i>
          <p>{searchTerm ? 'No se encontraron clientes con ese criterio' : 'Comienza creando tu primer cliente'}</p>
          {!searchTerm && (
            <button className="clients-btn clients-btn-primary" onClick={handleOpenCreate} type="button">
              <i className="fas fa-plus" aria-hidden="true"></i> Nuevo Cliente
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="clients-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Email</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Tipo</th>
              <th scope="col">Ciudad</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.idClient}>
                <td><strong>{client.name}</strong></td>
                <td>{client.email || '-'}</td>
                <td>
                  {client.phone || '-'}
                  {client.acceptSMS && (
                    <span className="badge badge-info ms-1" title="Acepta SMS">
                      <i className="fas fa-sms"></i>
                    </span>
                  )}
                </td>
                <td><span className="badge badge-secondary">{client.typeClient}</span></td>
                <td>{client.city}</td>
                <td>
                  <span className={`badge badge-${client.state === 'Active' ? 'success' : 'danger'}`}>
                    {client.state}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-action btn-info"
                      onClick={(e) => handleOpenDetail(client, e)}
                      title={`Ver detalle de ${client.name}`} type="button">
                      <i className="fas fa-eye" aria-hidden="true"></i>
                    </button>
                    <button className="btn-action btn-warning"
                      onClick={(e) => handleOpenEdit(client, e)}
                      title={`Editar ${client.name}`} type="button">
                      <i className="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button className="btn-action btn-danger"
                      onClick={(e) => handleOpenDelete(client, e)}
                      title={`Eliminar ${client.name}`} type="button">
                      <i className="fas fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="clients-container">

      <nav aria-label="Ruta de navegación" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item active" aria-current="page">Clientes</li>
        </ol>
      </nav>

      {success && (
        <div className="alert alert-success alert-dismissible" role="alert">
          <span><i className="fas fa-check-circle me-2" aria-hidden="true"></i>{success}</span>
          <button className="btn-close" onClick={() => setSuccess(null)} aria-label="Cerrar" type="button"></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          <span><i className="fas fa-exclamation-circle me-2" aria-hidden="true"></i>{error}</span>
          <button className="btn-close" onClick={() => setError(null)} aria-label="Cerrar" type="button"></button>
        </div>
      )}

      <div className="clients-card">
        <div className="clients-header">
          <div>
            <h4><i className="fas fa-users me-2" aria-hidden="true"></i>Gestión de Clientes</h4>
            <p className="text-muted mb-0">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} registrado{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="clients-btn clients-btn-primary" onClick={handleOpenCreate} type="button">
            <i className="fas fa-plus" aria-hidden="true"></i> Nuevo Cliente
          </button>
        </div>

        <div className="clients-search">
          <div className="search-box">
            <label htmlFor="client-search" className="sr-only">Buscar cliente</label>
            <i className="fas fa-search" aria-hidden="true"></i>
            <input
              id="client-search" type="search"
              placeholder="Buscar por nombre, email, teléfono..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')} type="button" aria-label="Limpiar">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>

        {renderContent()}
      </div>

      {/* ── ClientRegistration modal (create / edit) ── */}
      {showRegistration && (
        <ClientRegistration
          mode={formMode}
          clientId={selectedClient?.idClient ?? null}
          onClose={handleRegistrationClose}
          onSaved={handleRegistrationSaved}
        />
      )}

      {/* ── Detail modal ── */}
      {showDetailModal && selectedClient && (
        <div className="clients-modal-overlay"
          onClick={() => { setShowDetailModal(false); setSelectedClient(null); }}
          role="dialog">
          <div className="clients-modal clients-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="clients-modal-header">
              <div className="clients-modal-title">
                <div className="clients-modal-icon"><i className="fas fa-user"></i></div>
                <div>
                  <h5 className="clients-modal-h">Detalle del Cliente</h5>
                  <p className="clients-modal-sub">Información registrada del cliente.</p>
                </div>
              </div>
              <button className="clients-icon-btn"
                onClick={() => { setShowDetailModal(false); setSelectedClient(null); }} type="button">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="clients-modal-body">
              <div className="client-detail-header">
                <div className="client-detail-name">{selectedClient.name}</div>
                <div className="client-detail-role">
                  <span className="badge badge-secondary">{selectedClient.typeClient}</span>
                  <span className={`badge badge-${selectedClient.state === '1' ? 'success' : 'danger'}`}>
                    {selectedClient.state === '1' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <dl className="detail-section">
                <div className="detail-row"><dt>ID</dt><dd>{selectedClient.idClient}</dd></div>
                <div className="detail-row"><dt>Email</dt><dd>{selectedClient.email || '-'}</dd></div>
                <div className="detail-row"><dt>Teléfono</dt><dd>{selectedClient.phone || '-'}</dd></div>
                <div className="detail-row"><dt>Dirección</dt><dd>{selectedClient.address}</dd></div>
                <div className="detail-row"><dt>Ciudad</dt><dd>{selectedClient.city}</dd></div>
                <div className="detail-row"><dt>Ubicación</dt><dd>{selectedClient.location}</dd></div>
                <div className="detail-row"><dt>Servicio</dt><dd>{selectedClient.services}</dd></div>
                <div className="detail-row">
                  <dt>SMS</dt>
                  <dd>
                    {selectedClient.acceptSMS
                      ? <span className="badge badge-success">Sí</span>
                      : <span className="badge badge-secondary">No</span>}
                  </dd>
                </div>
                {selectedClient.comments && (
                  <div className="detail-row"><dt>Comentarios</dt><dd>{selectedClient.comments}</dd></div>
                )}
                <div className="detail-row">
                  <dt>Creado</dt>
                  <dd>{new Date(selectedClient.creationDate).toLocaleDateString('es-ES')}</dd>
                </div>
              </dl>
            </div>

            <div className="clients-modal-footer">
              <button className="clients-btn clients-btn-ghost"
                onClick={() => { setShowDetailModal(false); setSelectedClient(null); }} type="button">
                Cerrar
              </button>
              <button className="clients-btn clients-btn-primary"
                onClick={(e) => { setShowDetailModal(false); handleOpenEdit(selectedClient, e); }} type="button">
                <i className="fas fa-edit"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {showDeleteModal && selectedClient && (
        <div className="clients-modal-overlay"
          onClick={() => { setShowDeleteModal(false); setSelectedClient(null); }}
          role="dialog">
          <div className="clients-modal clients-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="clients-modal-header">
              <div className="clients-modal-title">
                <div className="clients-modal-icon clients-modal-icon-danger">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <h5 className="clients-modal-h">Confirmar Eliminación</h5>
                  <p className="clients-modal-sub">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <button className="clients-icon-btn"
                onClick={() => { setShowDeleteModal(false); setSelectedClient(null); }} type="button">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="clients-modal-body">
              <div className="delete-confirm">
                <p>¿Estás seguro que deseas eliminar a <strong>{selectedClient.name}</strong>?</p>
                <p className="delete-warning">
                  <i className="fas fa-info-circle me-1"></i>
                  Esta acción eliminará permanentemente el cliente y no podrá recuperarse.
                </p>
              </div>
            </div>
            <div className="clients-modal-footer">
              <button className="clients-btn clients-btn-ghost"
                onClick={() => { setShowDeleteModal(false); setSelectedClient(null); }} type="button">
                Cancelar
              </button>
              <button className="clients-btn clients-btn-danger" onClick={handleDelete} type="button">
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Clients;
