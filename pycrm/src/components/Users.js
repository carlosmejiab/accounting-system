// ===================================
// COMPONENTE: USERS
// ===================================

import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import '../styles/Users.css';

// ===================================
// HELPERS
// ===================================
const buildAvatarUrl = (name) => {
  const encoded = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${encoded}&background=667eea&color=fff&rounded=true&size=128`;
};

const getAvatar = (u) => {
  const v = (u?.avatar || '').trim();
  return v || buildAvatarUrl(u?.nombre || u?.username);
};

// Fallback si la API falla — coincide con dbo.Profiles
const ROLES_FALLBACK = [
  { value: 1, label: 'Super Administrador' },
  { value: 2, label: 'Administrador' },
  { value: 3, label: 'Operador' },
  { value: 4, label: 'Consulta' },
];

// Badge color según rol técnico (Admin/User que viene de dbo.Users)
const getRolBadgeClass = (rol) =>
  rol === 'Admin' ? 'badge-primary' : 'badge-secondary';

function Users() {

  // ===================================
  // ESTADOS
  // ===================================
  const [users, setUsers]               = useState([]);
  const [roles, setRoles]               = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize]                    = useState(10);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);
  const [searchTerm, setSearchTerm]   = useState('');

  const [showFormModal,   setShowFormModal]   = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode]         = useState('create');

  const emptyForm = { username: '', password: '', nombre: '', email: '', avatar: '', profileId: '' };
  const [formData, setFormData] = useState(emptyForm);

  // ===================================
  // CARGA DE PERFILES/ROLES (una vez al montar)
  // Viene de dbo.Profiles via spUsers_GetRoles
  // ===================================
  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      const result = await userService.getRoles();
      const lista = (result.data?.length > 0) ? result.data : ROLES_FALLBACK;
      setRoles(lista);
      // Pre-seleccionar el primer perfil disponible
      setFormData(prev => ({ ...prev, profileId: prev.profileId || lista[0].value }));
      setRolesLoading(false);
    };
    loadRoles();
  }, []);

  // ===================================
  // CARGA DE USUARIOS
  // ===================================
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getAll(currentPage, pageSize, searchTerm);
      if (result.success) {
        setUsers(result.data.items || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.totalItems || 0);
      } else {
        setError(result.message || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError(`Error al cargar usuarios: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Auto-limpiar alertas
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

  // ===================================
  // HELPERS DE PERFILES
  // Convierte profileId → label para mostrar en tabla/detalle
  // ===================================
  const getProfileLabel = (profileId) => {
    if (!profileId) return '—';
    const found = roles.find(r => r.value === profileId || r.value === Number(profileId));
    return found ? found.label : `Perfil #${profileId}`;
  };

  // ===================================
  // MANEJADORES DE MODALES
  // ===================================
  const closeAllModals = () => {
    setShowFormModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
  };

  const handleOpenCreateModal = () => {
    closeAllModals();
    setSelectedUser(null);
    setFormMode('create');
    setFormData({ ...emptyForm, profileId: roles[0]?.value || '' });
    setShowFormModal(true);
  };

  const handleOpenEditModal = useCallback((user) => {
    closeAllModals();
    setFormMode('edit');
    setSelectedUser(user);
    setFormData({
      username:  '',
      password:  '',
      nombre:    user.nombre  || '',
      email:     user.email   || '',
      avatar:    user.avatar  || '',
      profileId: user.profileId || roles[0]?.value || '',
    });
    setShowFormModal(true);
  }, [roles]);

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setSelectedUser(null);
    setFormData({ ...emptyForm, profileId: roles[0]?.value || '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // profileId viene como string del select, convertir a int
    setFormData(prev => ({
      ...prev,
      [name]: name === 'profileId' ? Number(value) : value,
    }));
  };

  // ===================================
  // SUBMIT (crear / editar)
  // ===================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      let result;
      if (formMode === 'create') {
        result = await userService.create({
          username:  formData.username,
          password:  formData.password,
          nombre:    formData.nombre,
          email:     formData.email,
          avatar:    (formData.avatar || '').trim() || buildAvatarUrl(formData.nombre || formData.username),
          profileId: formData.profileId,
        });
      } else {
        result = await userService.update(selectedUser.id, {
          nombre:    formData.nombre,
          email:     formData.email,
          avatar:    (formData.avatar || '').trim() || (selectedUser?.avatar || '').trim() || buildAvatarUrl(formData.nombre),
          profileId: formData.profileId,
        });
      }

      if (result.success) {
        setSuccess(result.message || 'Operación exitosa');
        handleCloseFormModal();
        loadUsers();
      } else {
        setError(result.message || 'Ocurrió un error');
      }
    } catch (err) {
      setError(`Error al guardar usuario: ${err.message}`);
    }
  };

  // ===================================
  // ELIMINAR
  // ===================================
  const handleDelete = async () => {
    try {
      const result = await userService.delete(selectedUser.id);
      if (result.success) {
        setSuccess(result.message || 'Usuario eliminado');
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        setError(result.message || 'No se pudo eliminar');
      }
    } catch (err) {
      setError(`Error al eliminar usuario: ${err.message}`);
    }
  };

  // ===================================
  // SELECT DE PERFIL — viene de dbo.Profiles
  // ===================================
  const ProfileSelect = () => {
    if (rolesLoading) {
      return (
        <div className="users-select-loading" aria-busy="true">
          <div className="select-spinner"></div>
          <span>Cargando perfiles...</span>
        </div>
      );
    }
    return (
      <select
        id="u-profileId"
        name="profileId"
        className="users-select"
        value={formData.profileId}
        onChange={handleInputChange}
        required
      >
        <option value="" disabled>Selecciona un perfil</option>
        {roles.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    );
  };

  // ===================================
  // RENDER TABLA / EMPTY / LOADING
  // ===================================
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner" role="status" aria-label="Cargando usuarios"></div>
          <p>Cargando usuarios...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-users" aria-hidden="true"></i>
          <p>{searchTerm ? 'No se encontraron usuarios con ese criterio' : 'Comienza creando tu primer usuario'}</p>
          {!searchTerm && (
            <button className="users-btn users-btn-primary" onClick={handleOpenCreateModal} type="button">
              <i className="fas fa-plus" aria-hidden="true"></i> Nuevo Usuario
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Usuario</th>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
                <th scope="col">Perfil</th>
                <th scope="col">Acceso</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-cell">
                      <img
                        src={getAvatar(user)}
                        alt=""
                        aria-hidden="true"
                        className="user-avatar-small"
                        onError={(e) => { e.currentTarget.src = buildAvatarUrl(user.nombre || user.username); }}
                      />
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td>
                    {/* Perfil de negocio: viene de dbo.Profiles */}
                    <span className="badge badge-info">
                      {getProfileLabel(user.profileId)}
                    </span>
                  </td>
                  <td>
                    {/* Rol técnico: Admin o User — controla acceso al JWT */}
                    <span className={`badge ${getRolBadgeClass(user.rol)}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${user.estado === 'Activo' ? 'success' : 'danger'}`}>
                      {user.estado}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-info"
                        onClick={() => { closeAllModals(); setSelectedUser(user); setShowDetailModal(true); }}
                        title={`Ver detalle de ${user.nombre}`}
                        type="button"
                      >
                        <i className="fas fa-eye" aria-hidden="true"></i>
                      </button>
                      <button
                        className="btn-action btn-warning"
                        onClick={() => handleOpenEditModal(user)}
                        title={`Editar ${user.nombre}`}
                        type="button"
                      >
                        <i className="fas fa-edit" aria-hidden="true"></i>
                      </button>
                      <button
                        className="btn-action btn-danger"
                        onClick={() => { closeAllModals(); setSelectedUser(user); setShowDeleteModal(true); }}
                        title={`Eliminar ${user.nombre}`}
                        type="button"
                      >
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginación" className="pagination-container">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              type="button"
              aria-label="Página anterior"
            >
              <i className="fas fa-chevron-left" aria-hidden="true"></i>
            </button>
            <span className="pagination-info">Página {currentPage} de {totalPages}</span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              type="button"
              aria-label="Página siguiente"
            >
              <i className="fas fa-chevron-right" aria-hidden="true"></i>
            </button>
          </nav>
        )}
      </>
    );
  };

  // ===================================
  // RENDER PRINCIPAL
  // ===================================
  return (
    <div className="users-container">

      <nav aria-label="Ruta de navegación" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item active" aria-current="page">Usuarios</li>
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

      <div className="users-card">
        <div className="users-header">
          <div>
            <h4><i className="fas fa-users me-2" aria-hidden="true"></i>Gestión de Usuarios</h4>
            <p className="text-muted mb-0">
              {totalItems} usuario{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="users-btn users-btn-primary" onClick={handleOpenCreateModal} type="button">
            <i className="fas fa-plus" aria-hidden="true"></i> Nuevo Usuario
          </button>
        </div>

        <div className="users-search">
          <div className="search-box">
            <label htmlFor="user-search" className="sr-only">Buscar usuario</label>
            <i className="fas fa-search" aria-hidden="true"></i>
            <input
              id="user-search"
              type="search"
              placeholder="Buscar por username, nombre o email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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

      {/* ===== MODAL: CREAR / EDITAR ===== */}
      {showFormModal && (
        <div
          className="users-modal-overlay"
          onClick={handleCloseFormModal}
          onKeyDown={(e) => { if (e.key === 'Escape') handleCloseFormModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fm-title"
          tabIndex={-1}
        >
          <div className="users-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className={`fas fa-${formMode === 'create' ? 'user-plus' : 'user-edit'}`} aria-hidden="true"></i>
                </div>
                <div>
                  <h5 id="fm-title" className="users-modal-h">
                    {formMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                  </h5>
                  <p className="users-modal-sub">
                    {formMode === 'create'
                      ? 'Completa los datos para registrar un nuevo usuario.'
                      : 'Actualiza la información del usuario seleccionado.'}
                  </p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={handleCloseFormModal} aria-label="Cerrar" type="button">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="users-modal-body">
                <div className="users-form-grid">

                  {formMode === 'create' && (
                    <>
                      <div className="users-field">
                        <label htmlFor="u-username" className="users-label">
                          Username <span className="users-required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="u-username" type="text" name="username"
                          className="users-input" value={formData.username}
                          onChange={handleInputChange} placeholder="Ej: cparedes"
                          required minLength={3} maxLength={50}
                          autoComplete="off" autoFocus
                        />
                      </div>
                      <div className="users-field">
                        <label htmlFor="u-password" className="users-label">
                          Contraseña <span className="users-required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="u-password" type="password" name="password"
                          className="users-input" value={formData.password}
                          onChange={handleInputChange} placeholder="Mínimo 8 caracteres"
                          required minLength={8} autoComplete="new-password"
                        />
                        <small className="users-help">Mínimo 8 caracteres.</small>
                      </div>
                    </>
                  )}

                  <div className="users-field users-field-full">
                    <label htmlFor="u-nombre" className="users-label">
                      Nombre Completo <span className="users-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="u-nombre" type="text" name="nombre"
                      className="users-input" value={formData.nombre}
                      onChange={handleInputChange} placeholder="Ej: Carlos Paredes"
                      required maxLength={100}
                    />
                  </div>

                  <div className="users-field users-field-full">
                    <label htmlFor="u-email" className="users-label">
                      Email <span className="users-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="u-email" type="email" name="email"
                      className="users-input" value={formData.email}
                      onChange={handleInputChange} placeholder="Ej: carlos@dominio.com"
                      required maxLength={100}
                    />
                  </div>

                  <div className="users-field users-field-full">
                    <label htmlFor="u-avatar" className="users-label">
                      Avatar URL <span style={{ fontWeight: 400, fontSize: '0.8rem' }}>(opcional)</span>
                    </label>
                    <input
                      id="u-avatar" type="url" name="avatar"
                      className="users-input" value={formData.avatar}
                      onChange={handleInputChange} placeholder="https://..."
                      maxLength={500}
                    />
                    <small className="users-help">Si lo dejas vacío se generará automáticamente.</small>
                  </div>

                  {/* ===== PERFIL — desde dbo.Profiles via SP ===== */}
                  <div className="users-field users-field-full">
                    <label htmlFor="u-profileId" className="users-label">
                      Perfil <span className="users-required" aria-hidden="true">*</span>
                    </label>
                    <ProfileSelect />
                    <small className="users-help">
                      El perfil define los permisos de negocio. El acceso al sistema
                      (Admin / User) se asigna automáticamente según el perfil seleccionado.
                    </small>
                  </div>

                  <div className="users-field">
                    <div className="users-tip" role="note">
                      <i className="fas fa-info-circle" aria-hidden="true"></i>
                      <span>
                        {formMode === 'create'
                          ? 'El usuario se creará con estado Activo.'
                          : 'Solo se actualizarán los campos editables.'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="users-modal-footer">
                <button type="button" className="users-btn users-btn-ghost" onClick={handleCloseFormModal}>
                  Cancelar
                </button>
                <button type="submit" className="users-btn users-btn-primary" disabled={rolesLoading}>
                  <i className="fas fa-save" aria-hidden="true"></i>
                  {formMode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETALLE ===== */}
      {showDetailModal && selectedUser && (
        <div
          className="users-modal-overlay"
          onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowDetailModal(false); setSelectedUser(null); } }}
          role="dialog" aria-modal="true" aria-labelledby="dm-title" tabIndex={-1}
        >
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className="fas fa-user" aria-hidden="true"></i>
                </div>
                <div>
                  <h5 id="dm-title" className="users-modal-h">Detalle del Usuario</h5>
                  <p className="users-modal-sub">Información registrada del usuario.</p>
                </div>
              </div>
              <button
                className="users-icon-btn"
                onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
                aria-label="Cerrar" type="button"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <div className="users-modal-body">
              <div className="user-detail-header">
                <img
                  src={getAvatar(selectedUser)}
                  alt={`Avatar de ${selectedUser.nombre}`}
                  className="user-avatar-large"
                  onError={(e) => { e.currentTarget.src = buildAvatarUrl(selectedUser.nombre || selectedUser.username); }}
                />
                <div className="user-detail-name">{selectedUser.nombre}</div>
                <div className="user-detail-role">
                  {/* Perfil de negocio */}
                  <span className="badge badge-info" style={{ marginRight: '6px' }}>
                    {getProfileLabel(selectedUser.profileId)}
                  </span>
                  {/* Rol técnico */}
                  <span className={`badge ${getRolBadgeClass(selectedUser.rol)}`} style={{ marginRight: '6px' }}>
                    {selectedUser.rol}
                  </span>
                  {/* Estado */}
                  <span className={`badge badge-${selectedUser.estado === 'Activo' ? 'success' : 'danger'}`}>
                    {selectedUser.estado}
                  </span>
                </div>
              </div>

              <dl className="detail-section">
                <div className="detail-row"><dt>ID</dt><dd>{selectedUser.id}</dd></div>
                <div className="detail-row"><dt>Username</dt><dd>{selectedUser.username}</dd></div>
                <div className="detail-row"><dt>Email</dt><dd>{selectedUser.email}</dd></div>
                <div className="detail-row"><dt>Perfil</dt><dd>{getProfileLabel(selectedUser.profileId)}</dd></div>
                <div className="detail-row"><dt>Acceso</dt><dd>{selectedUser.rol}</dd></div>
                <div className="detail-row">
                  <dt>Creado</dt>
                  <dd>{new Date(selectedUser.createdAt).toLocaleDateString('es-ES')}</dd>
                </div>
                {selectedUser.updatedAt && (
                  <div className="detail-row">
                    <dt>Actualizado</dt>
                    <dd>{new Date(selectedUser.updatedAt).toLocaleDateString('es-ES')}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="users-modal-footer">
              <button
                className="users-btn users-btn-ghost"
                onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
                type="button"
              >Cerrar</button>
              <button
                className="users-btn users-btn-primary"
                onClick={() => { setShowDetailModal(false); handleOpenEditModal(selectedUser); }}
                type="button"
              >
                <i className="fas fa-edit" aria-hidden="true"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ELIMINAR ===== */}
      {showDeleteModal && selectedUser && (
        <div
          className="users-modal-overlay"
          onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowDeleteModal(false); setSelectedUser(null); } }}
          role="dialog" aria-modal="true" aria-labelledby="del-title" tabIndex={-1}
        >
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon users-modal-icon-danger">
                  <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                </div>
                <div>
                  <h5 id="del-title" className="users-modal-h">Confirmar Eliminación</h5>
                  <p className="users-modal-sub">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <button
                className="users-icon-btn"
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                aria-label="Cerrar" type="button"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <div className="users-modal-body">
              <div className="delete-confirm">
                <div className="delete-avatar">
                  <img
                    src={getAvatar(selectedUser)}
                    alt={`Avatar de ${selectedUser.nombre}`}
                    onError={(e) => { e.currentTarget.src = buildAvatarUrl(selectedUser.nombre || selectedUser.username); }}
                  />
                </div>
                <p>¿Estás seguro que deseas eliminar a <strong>{selectedUser.nombre}</strong>?</p>
                <p className="delete-warning">
                  <i className="fas fa-info-circle me-1" aria-hidden="true"></i>
                  Esta acción eliminará permanentemente el usuario y no podrá recuperarse.
                </p>
              </div>
            </div>

            <div className="users-modal-footer">
              <button
                className="users-btn users-btn-ghost"
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                type="button"
              >Cancelar</button>
              <button className="users-btn users-btn-danger" onClick={handleDelete} type="button">
                <i className="fas fa-trash" aria-hidden="true"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Users;