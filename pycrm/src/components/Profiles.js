// ===================================
// COMPONENTE: PROFILES
// ===================================

import React, { useState, useEffect } from 'react';
import profilesService from '../services/profilesService';
import '../styles/Profiles.css';

function Profiles() {

  // ===================================
  // ESTADOS
  // ===================================

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [currentProfile, setCurrentProfile] = useState(null);
  const [profileDetail, setProfileDetail] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '' });

  const [permissionsMatrix, setPermissionsMatrix] = useState({
    modules: [],
    permissions: [],
    assignedPermissions: []
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => { loadProfiles(); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  // ===================================
  // FUNCIONES DE CARGA
  // ===================================

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const result = await profilesService.getAll();
      if (result.success) {
        setProfiles(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileDetail = async (id) => {
    try {
      const result = await profilesService.getById(id);
      if (result.success) {
        setProfileDetail(result.data);
        setShowDetailModal(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar detalle del perfil');
    }
  };

  const loadPermissionsMatrix = async (profileId = null) => {
    try {
      const result = await profilesService.getPermissionsMatrix(profileId);
      if (result.success) {
        setPermissionsMatrix(result.data);
        setSelectedPermissions(result.data.assignedPermissions || []);
        setShowPermissionsModal(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar permisos');
    }
  };

  // ===================================
  // MANEJADORES
  // ===================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await profilesService.create(formData);
      if (result.success) {
        setSuccess('Perfil creado exitosamente');
        setShowCreateModal(false);
        loadProfiles();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al crear perfil');
    }
  };

  const handleEdit = (profile) => {
    setCurrentProfile(profile);
    setFormData({ name: profile.name, description: profile.description || '' });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const result = await profilesService.update(currentProfile.id, formData);
      if (result.success) {
        setSuccess('Perfil actualizado exitosamente');
        setShowEditModal(false);
        loadProfiles();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al actualizar perfil');
    }
  };

  const handleDelete = (profile) => {
    setCurrentProfile(profile);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await profilesService.delete(currentProfile.id);
      if (result.success) {
        setSuccess('Perfil eliminado exitosamente');
        setShowDeleteModal(false);
        loadProfiles();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al eliminar perfil');
    }
  };

  const handlePermissions = async (profile) => {
    setCurrentProfile(profile);
    await loadPermissionsMatrix(profile.id);
  };

  const togglePermission = (moduleId, permissionId) => {
    setSelectedPermissions(prev => {
      const exists = prev.find(p => p.moduleId === moduleId && p.permissionId === permissionId);
      if (exists) return prev.filter(p => !(p.moduleId === moduleId && p.permissionId === permissionId));
      return [...prev, { moduleId, permissionId }];
    });
  };

  const isPermissionSelected = (moduleId, permissionId) =>
    selectedPermissions.some(p => p.moduleId === moduleId && p.permissionId === permissionId);

  const handleSavePermissions = async () => {
    try {
      const result = await profilesService.assignPermissions(currentProfile.id, selectedPermissions);
      if (result.success) {
        setSuccess('Permisos asignados exitosamente');
        setShowPermissionsModal(false);
        loadProfiles();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al asignar permisos');
    }
  };

  function getCategoryColor(category) {
    switch (category) {
      case 'CRUD': return 'primary';
      case 'EXPORT': return 'success';
      case 'SPECIAL': return 'warning';
      default: return 'secondary';
    }
  }

  // ===================================
  // RENDERIZADO
  // ===================================

  if (loading) {
    return (
      <div className="profiles-container fade-in">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profiles-container fade-in">

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Administración</a></li>
          <li className="breadcrumb-item active">Perfiles</li>
        </ol>
      </nav>

      {/* Mensajes */}
      {success && (
        <div className="alert alert-success alert-dismissible">
          <i className="fas fa-check-circle me-2"></i>{success}
          <button className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
          <button className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Card Principal */}
      <div className="profiles-card">

        {/* Header */}
        <div className="profiles-header">
          <div>
            <h4><i className="fas fa-id-card me-2"></i>Gestión de Perfiles</h4>
          </div>
          <button className="users-btn users-btn-primary" onClick={handleCreate}>
            <i className="fas fa-plus"></i>
            Nuevo Perfil
          </button>
        </div>

        {/* Tabla */}
        <div className="table-responsive">
          {profiles.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-id-card"></i>
              <p>No hay perfiles registrados</p>
              <button className="users-btn users-btn-primary" onClick={handleCreate}>
                <i className="fas fa-plus"></i> Crear Primer Perfil
              </button>
            </div>
          ) : (
            <table className="profiles-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Usuarios</th>
                  <th>Módulos</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id}>
                    <td><strong>{profile.name}</strong></td>
                    <td>{profile.description || '-'}</td>
                    <td>
                      <span className="badge bg-info">
                        <i className="fas fa-users me-1"></i>{profile.usersCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        <i className="fas fa-folder me-1"></i>{profile.modulesCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        <i className="fas fa-key me-1"></i>{profile.permissionsCount || 0}
                      </span>
                    </td>
                    <td>
                      {profile.isActive
                        ? <span className="badge bg-success">Activo</span>
                        : <span className="badge bg-danger">Inactivo</span>}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-info" onClick={() => loadProfileDetail(profile.id)} title="Ver detalle">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-action btn-primary" onClick={() => handlePermissions(profile)} title="Gestionar permisos">
                          <i className="fas fa-key"></i>
                        </button>
                        <button className="btn-action btn-warning" onClick={() => handleEdit(profile)} title="Editar">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-action btn-danger" onClick={() => handleDelete(profile)} title="Eliminar">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== MODAL: CREAR ===== */}
      {showCreateModal && (
        <div className="users-modal-overlay" onClick={() => setShowCreateModal(false)} role="dialog" aria-modal="true">
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div>
                  <h5 className="users-modal-h">Crear Nuevo Perfil</h5>
                  <p className="users-modal-sub">Completa los datos para registrar un nuevo perfil.</p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={() => setShowCreateModal(false)} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCreate}>
              <div className="users-modal-body">
                <div className="users-form-grid" style={{ gridTemplateColumns: '1fr' }}>

                  <div className="users-field">
                    <label className="users-label">
                      Nombre del Perfil <span className="users-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="users-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      minLength={3}
                      maxLength={100}
                      placeholder="Ej: Vendedor, Supervisor, etc."
                      autoFocus
                    />
                  </div>

                  <div className="users-field">
                    <label className="users-label">Descripción</label>
                    <textarea
                      name="description"
                      className="users-input"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={500}
                      placeholder="Descripción del perfil..."
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                </div>
              </div>

              <div className="users-modal-footer">
                <button type="button" className="users-btn users-btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="users-btn users-btn-primary">
                  <i className="fas fa-save"></i>
                  Crear Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR ===== */}
      {showEditModal && (
        <div className="users-modal-overlay" onClick={() => setShowEditModal(false)} role="dialog" aria-modal="true">
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <div>
                  <h5 className="users-modal-h">Editar Perfil</h5>
                  <p className="users-modal-sub">Actualiza la información del perfil seleccionado.</p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={() => setShowEditModal(false)} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="users-modal-body">
                <div className="users-form-grid" style={{ gridTemplateColumns: '1fr' }}>

                  <div className="users-field">
                    <label className="users-label">
                      Nombre del Perfil <span className="users-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="users-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      minLength={3}
                      maxLength={100}
                    />
                  </div>

                  <div className="users-field">
                    <label className="users-label">Descripción</label>
                    <textarea
                      name="description"
                      className="users-input"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={500}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                </div>
              </div>

              <div className="users-modal-footer">
                <button type="button" className="users-btn users-btn-ghost" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="users-btn users-btn-primary">
                  <i className="fas fa-save"></i>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ELIMINAR ===== */}
      {showDeleteModal && currentProfile && (
        <div className="users-modal-overlay" onClick={() => setShowDeleteModal(false)} role="dialog" aria-modal="true">
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon users-modal-icon-danger">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <h5 className="users-modal-h">Confirmar Eliminación</h5>
                  <p className="users-modal-sub">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={() => setShowDeleteModal(false)} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="users-modal-body">
              <p>¿Eliminar el perfil <strong>{currentProfile.name}</strong>?</p>
            </div>

            <div className="users-modal-footer">
              <button className="users-btn users-btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="users-btn users-btn-danger" onClick={handleConfirmDelete}>
                <i className="fas fa-trash"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: PERMISOS ===== */}
      {showPermissionsModal && (
        <div className="users-modal-overlay" onClick={() => setShowPermissionsModal(false)} role="dialog" aria-modal="true">
          <div className="users-modal profiles-modal-large" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <h5 className="users-modal-h">Gestionar Permisos</h5>
                  <p className="users-modal-sub">{currentProfile?.name}</p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={() => setShowPermissionsModal(false)} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="users-modal-body">
              <PermissionsContent />
            </div>

            <div className="users-modal-footer">
              <button className="users-btn users-btn-ghost" onClick={() => setShowPermissionsModal(false)}>
                Cancelar
              </button>
              <button className="users-btn users-btn-primary" onClick={handleSavePermissions}>
                <i className="fas fa-save"></i>
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETALLE ===== */}
      {showDetailModal && profileDetail && (
        <div className="users-modal-overlay" onClick={() => setShowDetailModal(false)} role="dialog" aria-modal="true">
          <div className="users-modal profiles-modal-large" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div>
                  <h5 className="users-modal-h">Detalle del Perfil</h5>
                  <p className="users-modal-sub">{profileDetail.name}</p>
                </div>
              </div>
              <button className="users-icon-btn" onClick={() => setShowDetailModal(false)} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="users-modal-body">
              <DetailContent />
            </div>

            <div className="users-modal-footer">
              <button className="users-btn users-btn-ghost" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
              <button className="users-btn users-btn-ghost" onClick={() => { setShowDetailModal(false); handleEdit(profileDetail); }}>
                <i className="fas fa-edit"></i> Editar
              </button>
              <button className="users-btn users-btn-primary" onClick={async () => { setShowDetailModal(false); await loadPermissionsMatrix(profileDetail.id); }}>
                <i className="fas fa-key"></i> Gestionar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // ===================================
  // SUB-COMPONENTES DE CONTENIDO
  // ===================================

  function PermissionsContent() {
    const groupedModules = {};
    permissionsMatrix.modules.forEach(module => {
      const parentName = module.parentName || 'Sin categoría';
      if (!groupedModules[parentName]) groupedModules[parentName] = [];
      groupedModules[parentName].push(module);
    });

    const crudPermissions = permissionsMatrix.permissions.filter(p => p.category === 'CRUD');
    const exportPermissions = permissionsMatrix.permissions.filter(p => p.category === 'EXPORT');
    const specialPermissions = permissionsMatrix.permissions.filter(p => p.category === 'SPECIAL');

    return (
      <>
        <div className="permissions-info">
          <i className="fas fa-info-circle me-2"></i>
          Selecciona los permisos que tendrá este perfil en cada módulo del sistema.
        </div>

        <div className="permissions-matrix">
          {/* Header */}
          <div className="permissions-header">
            <div className="module-column"><strong>Módulo</strong></div>
            <div className="permissions-columns">
              {crudPermissions.length > 0 && (
                <div className="permission-category">
                  <div className="category-label">CRUD</div>
                  <div className="permission-items">
                    {crudPermissions.map(p => (
                      <div key={p.permissionId} className="permission-header" title={p.permissionName}>{p.permissionCode}</div>
                    ))}
                  </div>
                </div>
              )}
              {exportPermissions.length > 0 && (
                <div className="permission-category">
                  <div className="category-label">EXPORT</div>
                  <div className="permission-items">
                    {exportPermissions.map(p => (
                      <div key={p.permissionId} className="permission-header" title={p.permissionName}>{p.permissionCode.replace('EXPORT_', '')}</div>
                    ))}
                  </div>
                </div>
              )}
              {specialPermissions.length > 0 && (
                <div className="permission-category">
                  <div className="category-label">SPECIAL</div>
                  <div className="permission-items">
                    {specialPermissions.map(p => (
                      <div key={p.permissionId} className="permission-header" title={p.permissionName}>{p.permissionCode}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filas */}
          {Object.entries(groupedModules).map(([parentName, modules]) => (
            <div key={parentName} className="module-group">
              <div className="group-header">
                <i className="fas fa-folder-open me-2"></i>{parentName}
              </div>
              {modules.map(module => (
                <div key={module.moduleId} className="permission-row">
                  <div className="module-column">
                    <i className={`${module.icon} me-2`}></i>{module.moduleName}
                  </div>
                  <div className="permissions-columns">
                    {[crudPermissions, exportPermissions, specialPermissions].map((group, gi) =>
                      group.length > 0 && (
                        <div key={gi} className="permission-category">
                          <div className="permission-items">
                            {group.map(perm => (
                              <div key={perm.permissionId} className="permission-checkbox">
                                <input
                                  type="checkbox"
                                  id={`perm-${module.moduleId}-${perm.permissionId}`}
                                  checked={isPermissionSelected(module.moduleId, perm.permissionId)}
                                  onChange={() => togglePermission(module.moduleId, perm.permissionId)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="permissions-summary mt-3">
          <i className="fas fa-check-circle me-2"></i>
          <strong>{selectedPermissions.length}</strong> permisos seleccionados
        </div>
      </>
    );
  }

  function DetailContent() {
    const permissionsByModule = {};
    profileDetail.permissions.forEach(perm => {
      if (!permissionsByModule[perm.moduleName]) {
        permissionsByModule[perm.moduleName] = { permissions: [] };
      }
      permissionsByModule[perm.moduleName].permissions.push(perm);
    });

    return (
      <>
        {/* Info General */}
        <div className="detail-section">
          <h6><i className="fas fa-id-card me-2"></i>Información General</h6>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Nombre</label>
              <div><strong>{profileDetail.name}</strong></div>
            </div>
            <div className="detail-item">
              <label>Estado</label>
              <div>
                {profileDetail.isActive
                  ? <span className="badge bg-success">Activo</span>
                  : <span className="badge bg-danger">Inactivo</span>}
              </div>
            </div>
            <div className="detail-item full-width">
              <label>Descripción</label>
              <div>{profileDetail.description || 'Sin descripción'}</div>
            </div>
            <div className="detail-item">
              <label>Creado</label>
              <div>{new Date(profileDetail.createdAt).toLocaleString('es-MX')}</div>
            </div>
            {profileDetail.updatedAt && (
              <div className="detail-item">
                <label>Última actualización</label>
                <div>{new Date(profileDetail.updatedAt).toLocaleString('es-MX')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Permisos */}
        <div className="detail-section">
          <h6><i className="fas fa-key me-2"></i>Permisos Asignados ({profileDetail.permissions.length})</h6>
          {profileDetail.permissions.length === 0 ? (
            <div className="users-tip">
              <i className="fas fa-info-circle"></i>
              <span>Este perfil no tiene permisos asignados</span>
            </div>
          ) : (
            <div className="permissions-list">
              {Object.entries(permissionsByModule).map(([moduleName, data]) => (
                <div key={moduleName} className="permission-module-item">
                  <div className="module-name">
                    <i className="fas fa-folder me-2"></i><strong>{moduleName}</strong>
                  </div>
                  <div className="module-permissions">
                    {data.permissions.map((perm, i) => (
                      <span key={i} className={`badge bg-${getCategoryColor(perm.permissionCategory)}`}>
                        {perm.permissionName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usuarios */}
        <div className="detail-section">
          <h6><i className="fas fa-users me-2"></i>Usuarios Asignados ({profileDetail.users.length})</h6>
          {profileDetail.users.length === 0 ? (
            <div className="users-tip">
              <i className="fas fa-info-circle"></i>
              <span>Este perfil no tiene usuarios asignados</span>
            </div>
          ) : (
            <div className="users-list">
              {profileDetail.users.map(user => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">{user.nombre.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                      <div className="user-name">{user.nombre}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="user-meta">
                    <small>Asignado: {new Date(user.assignedAt).toLocaleDateString('es-MX')}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

}

export default Profiles;