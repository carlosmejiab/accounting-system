// ===================================
// COMPONENTE: DOCUMENTS — 3-column layout
// ===================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import documentService      from '../services/documentService';
import storageConfigService  from '../services/storageConfigService';
import taskService           from '../services/taskService';
import clientService         from '../services/clientService';
import '../styles/Documents.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const EXT_META = {
  pdf:  { icon: 'fa-file-pdf',        bg: 'doc-bg-pdf',   badge: 'doc-badge-red'    },
  doc:  { icon: 'fa-file-word',       bg: 'doc-bg-word',  badge: 'doc-badge-blue'   },
  docx: { icon: 'fa-file-word',       bg: 'doc-bg-word',  badge: 'doc-badge-blue'   },
  xls:  { icon: 'fa-file-excel',      bg: 'doc-bg-excel', badge: 'doc-badge-green'  },
  xlsx: { icon: 'fa-file-excel',      bg: 'doc-bg-excel', badge: 'doc-badge-green'  },
  ppt:  { icon: 'fa-file-powerpoint', bg: 'doc-bg-ppt',   badge: 'doc-badge-orange' },
  pptx: { icon: 'fa-file-powerpoint', bg: 'doc-bg-ppt',   badge: 'doc-badge-orange' },
  jpg:  { icon: 'fa-file-image',      bg: 'doc-bg-img',   badge: 'doc-badge-purple' },
  jpeg: { icon: 'fa-file-image',      bg: 'doc-bg-img',   badge: 'doc-badge-purple' },
  png:  { icon: 'fa-file-image',      bg: 'doc-bg-img',   badge: 'doc-badge-purple' },
  gif:  { icon: 'fa-file-image',      bg: 'doc-bg-img',   badge: 'doc-badge-purple' },
  zip:  { icon: 'fa-file-archive',    bg: 'doc-bg-zip',   badge: 'doc-badge-orange' },
  txt:  { icon: 'fa-file-alt',        bg: 'doc-bg-txt',   badge: 'doc-badge-gray'   },
  csv:  { icon: 'fa-file-csv',        bg: 'doc-bg-csv',   badge: 'doc-badge-green'  },
};
const extMeta = ext => EXT_META[(ext||'').toLowerCase()] || { icon:'fa-file', bg:'doc-bg-file', badge:'doc-badge-gray' };
const fmtDate = dt => dt ? new Date(dt).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' }) : '—';
const EMPTY_UPLOAD = { nameDocument:'', description:'', idEmployee:'', idFolder:'', idStatusDocument:'' };

// ── FolderSidebar ──────────────────────────────────────────────────────────────

function FolderSidebar({ allFolders, allDocs, sidebarFilter, onFilterChange, statusCat, onCreateFolder }) {
  const [expanded, setExpanded]         = useState(new Set());
  const [treeSearch, setTreeSearch]     = useState('');

  // Group folders by client
  const folderTree = useMemo(() => {
    const map = {};
    allFolders.forEach(f => {
      if (!f.idClient) return;
      if (!map[f.idClient]) map[f.idClient] = { idClient: f.idClient, clientName: f.clientName || '—', folders: [] };
      map[f.idClient].folders.push(f);
    });
    return Object.values(map).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [allFolders]);

  // Doc counts
  const countByFolder = useMemo(() => {
    const c = {};
    allDocs.forEach(d => { if (d.idFolder) c[d.idFolder] = (c[d.idFolder] || 0) + 1; });
    return c;
  }, [allDocs]);

  const countByClient = useMemo(() => {
    const c = {};
    allDocs.forEach(d => {
      const cid = d.idClient || d.idClientTask;
      if (cid) c[cid] = (c[cid] || 0) + 1;
    });
    return c;
  }, [allDocs]);

  const toggle = id => setExpanded(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const filteredTree = useMemo(() => {
    if (!treeSearch.trim()) return folderTree;
    const q = treeSearch.toLowerCase();
    return folderTree
      .map(c => ({ ...c, folders: c.folders.filter(f => f.name.toLowerCase().includes(q)) }))
      .filter(c => c.clientName.toLowerCase().includes(q) || c.folders.length > 0);
  }, [folderTree, treeSearch]);

  return (
    <aside className="doc-sidebar">
      {/* All Docs */}
      <button
        className={`doc-sb-all${sidebarFilter.type === 'all' ? ' active' : ''}`}
        onClick={() => onFilterChange({ type:'all', clientId:null, folderId:null, status: sidebarFilter.status })}
      >
        <i className="fas fa-layer-group" />
        <span>All Documents</span>
        <span className="doc-sb-count">{allDocs.length}</span>
      </button>

      {/* Folder tree */}
      <div className="doc-sb-section">
        <div className="doc-sb-section-title">
          <span><i className="fas fa-folder-open" /> FOLDERS</span>
          <button className="doc-sb-new-folder-btn" onClick={onCreateFolder}>
            <i className="fas fa-plus" /> New
          </button>
        </div>
        <div className="doc-sb-search-wrap">
          <i className="fas fa-search" />
          <input
            className="doc-sb-search"
            type="text"
            placeholder="Filter clients..."
            value={treeSearch}
            onChange={e => setTreeSearch(e.target.value)}
          />
        </div>
        <div className="doc-sb-tree">
          {filteredTree.map(client => (
            <div key={client.idClient} className="doc-tree-node">
              <div
                className={`doc-tree-client${sidebarFilter.type === 'client' && sidebarFilter.clientId === client.idClient ? ' active' : ''}`}
                onClick={() => {
                  toggle(client.idClient);
                  onFilterChange({ type:'client', clientId:client.idClient, folderId:null, status: sidebarFilter.status });
                }}
              >
                <i className={`fas fa-chevron-${expanded.has(client.idClient) ? 'down' : 'right'} doc-tree-chevron`} />
                <i className="fas fa-user-tie doc-tree-client-icon" />
                <span className="doc-tree-label">{client.clientName}</span>
                <span className="doc-sb-count">{countByClient[client.idClient] || 0}</span>
              </div>
              {expanded.has(client.idClient) && (
                <div className="doc-tree-children">
                  {client.folders.map(f => (
                    <div
                      key={f.idFolder}
                      className={`doc-tree-folder${sidebarFilter.type === 'folder' && sidebarFilter.folderId === f.idFolder ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); onFilterChange({ type:'folder', clientId:client.idClient, folderId:f.idFolder, status: sidebarFilter.status }); }}
                    >
                      <i className="fas fa-folder" />
                      <span className="doc-tree-label">{f.name}</span>
                      <span className="doc-sb-count">{countByFolder[f.idFolder] || 0}</span>
                    </div>
                  ))}
                  {client.folders.length === 0 && <div className="doc-tree-no-folders">No folders</div>}
                </div>
              )}
            </div>
          ))}
          {filteredTree.length === 0 && (
            <div className="doc-tree-no-folders" style={{ padding:'.75rem' }}>No folders found</div>
          )}
        </div>
      </div>

      {/* Status filter */}
      {statusCat.length > 0 && (
        <div className="doc-sb-section">
          <div className="doc-sb-section-title"><i className="fas fa-tags" /> STATUS</div>
          <div className="doc-sb-status-pills">
            <button
              className={`doc-status-pill${!sidebarFilter.status ? ' active' : ''}`}
              onClick={() => onFilterChange({ ...sidebarFilter, status:'' })}
            >All</button>
            {statusCat.map(s => (
              <button
                key={s.idTabla}
                className={`doc-status-pill${sidebarFilter.status === String(s.idTabla) ? ' active' : ''}`}
                onClick={() => onFilterChange({ ...sidebarFilter, status: String(s.idTabla) })}
              >{s.description}</button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── PreviewPanel ──────────────────────────────────────────────────────────────

function PreviewPanel({ doc, onClose, onDownload, onDelete }) {
  const [blobUrl,     setBlobUrl]     = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const prevIdRef = useRef(null);

  useEffect(() => {
    let revoke = null;
    if (!doc) { setBlobUrl(null); return; }
    if (doc.idDocument === prevIdRef.current) return;
    prevIdRef.current = doc.idDocument;

    const ext = (doc.extension || '').toLowerCase();
    const canPreview = ['pdf','jpg','jpeg','png','gif'].includes(ext);
    if (!canPreview) { setBlobUrl(null); return; }

    setBlobLoading(true);
    setBlobUrl(null);
    documentService.fetchBlob(doc.idDocument).then(r => {
      if (r.success) { setBlobUrl(r.url); revoke = r.url; }
      setBlobLoading(false);
    });

    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [doc?.idDocument]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!doc) {
    return (
      <div className="doc-preview doc-preview-empty">
        <i className="fas fa-eye" />
        <p>Select a document<br/>to preview</p>
      </div>
    );
  }

  const m      = extMeta(doc.extension);
  const ext    = (doc.extension || '').toLowerCase();
  const isPdf  = ext === 'pdf';
  const isImg  = ['jpg','jpeg','png','gif'].includes(ext);
  const clientLabel = doc.clientName || doc.clientTaskName || null;

  return (
    <div className="doc-preview">
      {/* Header */}
      <div className="doc-preview-hdr">
        <div className="doc-preview-title-row">
          <div className={`doc-preview-icon ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
          <div className="doc-preview-title">
            <div className="doc-preview-name">{doc.nameDocument}</div>
            <div className="doc-preview-fname">{doc.fileName || '—'}</div>
          </div>
        </div>
        <button className="doc-preview-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
      </div>

      {/* Content */}
      <div className="doc-preview-content">
        {blobLoading ? (
          <div className="doc-preview-loader"><div className="doc-spinner" /> Loading...</div>
        ) : blobUrl && isPdf ? (
          <iframe src={blobUrl} title={doc.nameDocument} className="doc-preview-iframe" />
        ) : blobUrl && isImg ? (
          <div className="doc-preview-img-wrap">
            <img src={blobUrl} alt={doc.nameDocument} className="doc-preview-img" />
          </div>
        ) : (
          <div className="doc-preview-no-preview">
            <div className={`doc-preview-big-icon ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
            <p>No preview available</p>
            <small>{ext.toUpperCase() || 'FILE'}</small>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="doc-preview-meta">
        {clientLabel && <MetaRow icon="fa-user-tie"     label="Client"      value={clientLabel} />}
        {doc.taskName  && <MetaRow icon="fa-tasks"       label="Task"        value={`#${doc.idTask} — ${doc.taskName}`} />}
        {doc.folderName && <MetaRow icon="fa-folder"     label="Folder"      value={doc.folderName} />}
        {doc.assignedTo && <MetaRow icon="fa-user"       label="Assigned To" value={doc.assignedTo} />}
        {doc.statusDocument && (
          <div className="doc-meta-row">
            <span className="doc-meta-lbl"><i className="fas fa-tag" /> Status</span>
            <span className={`doc-badge ${m.badge}`}>{doc.statusDocument}</span>
          </div>
        )}
        {doc.username   && <MetaRow icon="fa-upload"     label="Uploaded By" value={doc.username} />}
        <MetaRow          icon="fa-calendar-alt"          label="Date"        value={fmtDate(doc.creationDate)} />
        {doc.description && <MetaRow icon="fa-align-left" label="Notes"       value={doc.description} multiline />}
      </div>

      {/* Actions */}
      <div className="doc-preview-actions">
        <button className="doc-btn doc-btn-primary" onClick={() => onDownload(doc)}>
          <i className="fas fa-download" /> Download
        </button>
        <button className="doc-btn doc-btn-danger-outline" onClick={() => onDelete(doc)}>
          <i className="fas fa-trash-alt" /> Delete
        </button>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value, multiline }) {
  return (
    <div className={`doc-meta-row${multiline ? ' doc-meta-row-multi' : ''}`}>
      <span className="doc-meta-lbl"><i className={`fas ${icon}`} /> {label}</span>
      <span className="doc-meta-val">{value}</span>
    </div>
  );
}

// ── ViewerModal ────────────────────────────────────────────────────────────────

function ViewerModal({ doc, onClose, onDownload }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let revoke = null;
    if (!doc) return;
    const ext = (doc.extension || '').toLowerCase();
    if (!['pdf','jpg','jpeg','png','gif'].includes(ext)) return;
    setLoading(true);
    setBlobUrl(null);
    documentService.fetchBlob(doc.idDocument).then(r => {
      if (r.success) { setBlobUrl(r.url); revoke = r.url; }
      setLoading(false);
    });
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [doc?.idDocument]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!doc) return null;

  const m   = extMeta(doc.extension);
  const ext = (doc.extension || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImg = ['jpg','jpeg','png','gif'].includes(ext);
  const clientLabel = doc.clientName || doc.clientTaskName || null;

  return (
    <div className="doc-viewer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="doc-viewer-modal">

        {/* Header */}
        <div className="doc-viewer-header">
          <div className="doc-viewer-title">
            <div className={`doc-file-icon-sm ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
            <div>
              <div className="doc-viewer-name">{doc.nameDocument}</div>
              <div className="doc-viewer-sub">
                {doc.fileName || ''}
                {clientLabel ? <span> · <i className="fas fa-user-tie" /> {clientLabel}</span> : null}
                {doc.taskName ? <span> · <i className="fas fa-tasks" /> #{doc.idTask} {doc.taskName}</span> : null}
              </div>
            </div>
          </div>
          <div className="doc-viewer-header-actions">
            <button className="doc-btn doc-btn-primary doc-btn-sm" onClick={() => onDownload(doc)}>
              <i className="fas fa-download" /> Download
            </button>
            <button className="doc-viewer-close" onClick={onClose} title="Close">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="doc-viewer-body">
          {loading ? (
            <div className="doc-viewer-state"><div className="doc-spinner" /> Loading preview...</div>
          ) : blobUrl && isPdf ? (
            <iframe src={blobUrl} title={doc.nameDocument} className="doc-viewer-iframe" />
          ) : blobUrl && isImg ? (
            <div className="doc-viewer-img-wrap">
              <img src={blobUrl} alt={doc.nameDocument} className="doc-viewer-img" />
            </div>
          ) : (
            <div className="doc-viewer-state">
              <div className={`doc-preview-big-icon ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
              <p>No preview for <strong>.{ext.toUpperCase() || 'this file'}</strong></p>
              <button className="doc-btn doc-btn-primary" onClick={() => onDownload(doc)}>
                <i className="fas fa-download" /> Download to open
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── DocGrid ────────────────────────────────────────────────────────────────────

function DocGrid({ docs, selectedIds, onToggleSelect, onPreview, onDownload, onDelete, onView }) {
  return (
    <div className="doc-grid">
      {docs.map(doc => {
        const m   = extMeta(doc.extension);
        const sel = selectedIds.has(doc.idDocument);
        const lbl = doc.clientName || doc.clientTaskName || null;
        return (
          <div
            key={doc.idDocument}
            className={`doc-grid-card${sel ? ' selected' : ''}`}
            onClick={() => onPreview(doc)}
            onDoubleClick={() => onView(doc)}
          >
            <div className="doc-grid-card-check" onClick={e => { e.stopPropagation(); onToggleSelect(doc.idDocument); }}>
              <input type="checkbox" checked={sel} onChange={() => {}} onClick={e => e.stopPropagation()} />
            </div>
            <div className={`doc-grid-icon ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
            <div className="doc-grid-name">{doc.nameDocument}</div>
            <div className="doc-grid-sub">
              {lbl           && <span><i className="fas fa-user-tie" /> {lbl}</span>}
              {doc.folderName && <span><i className="fas fa-folder" /> {doc.folderName}</span>}
            </div>
            <div className="doc-grid-footer">
              <span className={`doc-badge ${m.badge}`}>{doc.statusDocument || '—'}</span>
              <span className="doc-grid-date">{fmtDate(doc.creationDate)}</span>
            </div>
            <div className="doc-grid-actions">
              <button title="View" className="view" onClick={e => { e.stopPropagation(); onView(doc); }}>
                <i className="fas fa-eye" />
              </button>
              <button title="Download" onClick={e => { e.stopPropagation(); onDownload(doc); }}>
                <i className="fas fa-download" />
              </button>
              <button title="Delete" className="danger" onClick={e => { e.stopPropagation(); onDelete(doc); }}>
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Documents() {

  // ── Data ──────────────────────────────────────────────────────────────────
  const [allDocs,    setAllDocs]    = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [loading,    setLoading]    = useState(false);

  // ── Catalogs for upload form ───────────────────────────────────────────────
  const [statusCat,   setStatusCat]   = useState([]);
  const [employeeCat, setEmployeeCat] = useState([]);
  const [pickerTasks,   setPickerTasks]   = useState([]);
  const [pickerClients, setPickerClients] = useState([]);

  // ── Sidebar / filter ──────────────────────────────────────────────────────
  const [sidebarFilter, setSidebarFilter] = useState({ type:'all', clientId:null, folderId:null, status:'' });
  const [search,        setSearch]        = useState('');

  // ── View mode + selection ─────────────────────────────────────────────────
  const [viewMode,    setViewMode]    = useState('list');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Preview panel ─────────────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState(null);

  // ── Viewer modal (full-screen) ────────────────────────────────────────────
  const [viewerDoc, setViewerDoc] = useState(null);

  // ── Upload modal ──────────────────────────────────────────────────────────
  const [uploadOpen,  setUploadOpen]  = useState(false);
  const [uploadMode,  setUploadMode]  = useState('task');
  const [uploadForm,  setUploadForm]  = useState(EMPTY_UPLOAD);
  const [uploadFile,  setUploadFile]  = useState(null);
  const [uploadDrag,  setUploadDrag]  = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [uploading,   setUploading]   = useState(false);
  const [uploadMsg,   setUploadMsg]   = useState({ type:'', text:'' });
  const [folderOpts,  setFolderOpts]  = useState([]);
  const [modalTask,   setModalTask]   = useState(null);
  const [modalClient, setModalClient] = useState(null);
  const [targetSearch, setTargetSearch] = useState('');
  const dropRef = useRef(null);

  // ── Delete modal ──────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDoc,  setDeleteDoc]  = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  // ── Create folder modal ───────────────────────────────────────────────────
  const [folderModalOpen,   setFolderModalOpen]   = useState(false);
  const [folderModalMode,   setFolderModalMode]   = useState('client'); // 'client' | 'task'
  const [folderModalName,   setFolderModalName]   = useState('');
  const [folderModalTarget, setFolderModalTarget] = useState(null);  // {id, name}
  const [folderModalSearch, setFolderModalSearch] = useState('');
  const [folderModalSaving, setFolderModalSaving] = useState(false);
  const [folderModalMsg,    setFolderModalMsg]    = useState({ type:'', text:'' });

  // ── Storage config modal ──────────────────────────────────────────────────
  const [cfgOpen,   setCfgOpen]   = useState(false);
  const [cfgForm,   setCfgForm]   = useState({ basePath:'', taskTemplate:'', clientTemplate:'' });
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgMsg,    setCfgMsg]    = useState({ type:'', text:'' });

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load all data ─────────────────────────────────────────────────────────
  const reloadDocs = useCallback(async () => {
    const r = await documentService.getAll();
    if (r.success) setAllDocs(r.data || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [docR, folderR, statusR, empR, taskR, clientR] = await Promise.all([
        documentService.getAll(),
        documentService.getFolders(),
        documentService.getCatalog('MStatusDoc'),
        taskService.getEmployees(),
        taskService.getAll(),
        clientService.getAll(),
      ]);
      if (docR.success)    setAllDocs(docR.data || []);
      if (folderR.success) setAllFolders(folderR.data || []);
      if (statusR.success) setStatusCat(statusR.data || []);
      if (empR.success)    setEmployeeCat((empR.data || []).map(e => ({ id: e.idEmployee, name: e.fullName || '' })));
      if (taskR.success)   setPickerTasks((taskR.data || []).filter(t => t.state !== '0' && t.state !== 'Inactive').sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
      if (clientR.success) setPickerClients((clientR.data || []).filter(c => c.state !== 'Inactive').sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
      setLoading(false);
    };
    load();
  }, []);

  // ── Folder opts for upload modal ──────────────────────────────────────────
  useEffect(() => {
    if (!uploadOpen) return;
    if (uploadMode === 'task' && modalTask) {
      const fid = modalTask.idFolder;
      if (fid) {
        setFolderOpts(allFolders.filter(f => f.idFolder === fid));
        setUploadForm(p => ({ ...p, idFolder: String(fid) }));
      } else {
        setFolderOpts([]);
        setUploadForm(p => ({ ...p, idFolder: '' }));
      }
    } else if (uploadMode === 'client' && modalClient) {
      documentService.getFoldersByClient(modalClient.idClient).then(r => {
        setFolderOpts(r.success ? r.data : allFolders);
      });
    } else {
      setFolderOpts([]);
    }
  }, [uploadOpen, uploadMode, modalTask?.idTask, modalClient?.idClient, allFolders]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered docs ─────────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let r = allDocs;
    if (sidebarFilter.type === 'folder' && sidebarFilter.folderId) {
      r = r.filter(d => d.idFolder === sidebarFilter.folderId);
    } else if (sidebarFilter.type === 'client' && sidebarFilter.clientId) {
      r = r.filter(d => d.idClient === sidebarFilter.clientId || d.idClientTask === sidebarFilter.clientId);
    }
    if (sidebarFilter.status) {
      r = r.filter(d => d.idStatusDocument === Number(sidebarFilter.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(d =>
        d.nameDocument.toLowerCase().includes(q) ||
        (d.clientName||'').toLowerCase().includes(q) ||
        (d.clientTaskName||'').toLowerCase().includes(q) ||
        (d.taskName||'').toLowerCase().includes(q) ||
        (d.assignedTo||'').toLowerCase().includes(q) ||
        (d.folderName||'').toLowerCase().includes(q)
      );
    }
    return r;
  }, [allDocs, sidebarFilter, search]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = id => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredDocs.length
      ? new Set()
      : new Set(filteredDocs.map(d => d.idDocument))
    );
  };

  // ── Open upload ───────────────────────────────────────────────────────────
  const openUpload = (mode = 'task') => {
    setUploadMode(mode);
    setModalTask(null); setModalClient(null); setTargetSearch('');
    setUploadForm(EMPTY_UPLOAD); setUploadFile(null); setUploadPct(0);
    setUploadMsg({ type:'', text:'' }); setUploadOpen(true);
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver  = e => { e.preventDefault(); setUploadDrag(true); };
  const handleDragLeave = () => setUploadDrag(false);
  const handleDrop      = e => {
    e.preventDefault(); setUploadDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setUploadFile(f); setUploadForm(p => ({ ...p, nameDocument: p.nameDocument || f.name.replace(/\.[^/.]+$/, '') })); }
  };
  const handleFileInput = e => {
    const f = e.target.files?.[0];
    if (f) { setUploadFile(f); setUploadForm(p => ({ ...p, nameDocument: p.nameDocument || f.name.replace(/\.[^/.]+$/, '') })); }
  };

  // ── Upload submit ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (uploadMode === 'task'   && !modalTask)   return setUploadMsg({ type:'error', text:'Select a task first.' });
    if (uploadMode === 'client' && !modalClient) return setUploadMsg({ type:'error', text:'Select a client first.' });
    if (!uploadFile)                             return setUploadMsg({ type:'error', text:'Please select a file.' });
    if (!uploadForm.nameDocument.trim())         return setUploadMsg({ type:'error', text:'Document name is required.' });
    if (!uploadForm.idEmployee)                  return setUploadMsg({ type:'error', text:'Assigned employee is required.' });
    if (!uploadForm.idStatusDocument)            return setUploadMsg({ type:'error', text:'Status is required.' });

    setUploading(true); setUploadPct(0); setUploadMsg({ type:'', text:'' });
    const fd = new FormData();
    fd.append('file',             uploadFile);
    fd.append('nameDocument',     uploadForm.nameDocument.trim());
    fd.append('description',      uploadForm.description || '');
    fd.append('idEmployee',       uploadForm.idEmployee);
    fd.append('idFolder',         uploadForm.idFolder || modalTask?.idFolder || '');
    fd.append('idStatusDocument', uploadForm.idStatusDocument);
    if (uploadMode === 'task'   && modalTask)   fd.append('idTask',   modalTask.idTask);
    if (uploadMode === 'client' && modalClient) fd.append('idClient', modalClient.idClient);

    const res = await documentService.uploadWithProgress(fd, setUploadPct);
    if (res.success) {
      setUploadOpen(false);
      showToast('success', 'Document uploaded successfully.');
      reloadDocs();
    } else {
      setUploadMsg({ type:'error', text: res.message });
    }
    setUploading(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete = doc => { setDeleteDoc(doc); setDeleteOpen(true); };
  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    const res = await documentService.delete(deleteDoc.idDocument);
    if (res.success) {
      setDeleteOpen(false);
      if (previewDoc?.idDocument === deleteDoc.idDocument) setPreviewDoc(null);
      setSelectedIds(prev => { const s = new Set(prev); s.delete(deleteDoc.idDocument); return s; });
      setDeleteDoc(null);
      showToast('success', 'Document deleted.');
      reloadDocs();
    } else {
      showToast('error', res.message);
    }
    setDeleting(false);
  };

  // ── Batch download ────────────────────────────────────────────────────────
  const handleBatchDownload = async () => {
    for (const id of selectedIds) {
      const doc = allDocs.find(d => d.idDocument === id);
      if (doc) await handleDownload(doc);
    }
  };

  // ── Batch delete ──────────────────────────────────────────────────────────
  const handleBatchDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} documents?`)) return;
    for (const id of selectedIds) {
      await documentService.delete(id);
    }
    setSelectedIds(new Set());
    if (previewDoc && selectedIds.has(previewDoc.idDocument)) setPreviewDoc(null);
    showToast('success', `${selectedIds.size} documents deleted.`);
    reloadDocs();
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async doc => {
    const name = doc.nameDocument + (doc.extension ? '.' + doc.extension : '');
    const res  = await documentService.download(doc.idDocument, name);
    if (!res.success) showToast('error', res.message || 'Download failed.');
  };

  // ── Storage config ────────────────────────────────────────────────────────
  const openConfig = async () => {
    const r = await storageConfigService.get();
    if (r.success && r.data) setCfgForm({ basePath: r.data.basePath, taskTemplate: r.data.taskTemplate, clientTemplate: r.data.clientTemplate });
    setCfgMsg({ type:'', text:'' }); setCfgOpen(true);
  };
  const handleSaveConfig = async () => {
    if (!cfgForm.basePath.trim()) return setCfgMsg({ type:'error', text:'Base path is required.' });
    setCfgSaving(true);
    const r = await storageConfigService.update(cfgForm);
    setCfgSaving(false);
    if (r.success) { setCfgOpen(false); showToast('success', 'Storage config saved.'); }
    else setCfgMsg({ type:'error', text: r.message });
  };

  // ── Create folder ─────────────────────────────────────────────────────────
  const openFolderModal = () => {
    setFolderModalName(''); setFolderModalTarget(null); setFolderModalSearch('');
    setFolderModalMode('client'); setFolderModalMsg({ type:'', text:'' }); setFolderModalOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!folderModalName.trim())   return setFolderModalMsg({ type:'error', text:'Folder name is required.' });
    if (!folderModalTarget)        return setFolderModalMsg({ type:'error', text:`Select a ${folderModalMode} first.` });
    setFolderModalSaving(true);
    const payload = {
      name:        folderModalName.trim(),
      idClient:    folderModalMode === 'client' ? folderModalTarget.id : null,
      idTask:      folderModalMode === 'task'   ? folderModalTarget.id : null,
      isPrincipal: true,
    };
    const res = await documentService.createFolder(payload);
    setFolderModalSaving(false);
    if (res.success) {
      setFolderModalOpen(false);
      showToast('success', `Folder "${folderModalName.trim()}" created.`);
      const r = await documentService.getFolders();
      if (r.success) setAllFolders(r.data || []);
    } else {
      setFolderModalMsg({ type:'error', text: res.message || 'Failed to create folder.' });
    }
  };

  // ── Breadcrumb label ──────────────────────────────────────────────────────
  const breadcrumb = useMemo(() => {
    if (sidebarFilter.type === 'all')    return null;
    if (sidebarFilter.type === 'client') {
      const c = allFolders.find(f => f.idClient === sidebarFilter.clientId);
      return c?.clientName || null;
    }
    if (sidebarFilter.type === 'folder') {
      const f = allFolders.find(f => f.idFolder === sidebarFilter.folderId);
      const c = allFolders.find(f2 => f2.idClient === sidebarFilter.clientId);
      return f && c ? `${c.clientName} › ${f.name}` : f?.name || null;
    }
    return null;
  }, [sidebarFilter, allFolders]);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="doc-page">

      {/* Toast */}
      {toast && (
        <div className={`doc-toast doc-toast-${toast.type}`} onClick={() => setToast(null)}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`} /> {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="doc-header">
        <h2 className="doc-title"><i className="fas fa-folder-open" /> Customer Documents</h2>
        <div className="doc-header-actions">
          <button className="doc-btn doc-btn-ghost" onClick={openConfig}>
            <i className="fas fa-cog" /> Settings
          </button>
          <button className="doc-btn doc-btn-primary" onClick={() => openUpload('task')}>
            <i className="fas fa-cloud-upload-alt" /> Upload Document
          </button>
        </div>
      </div>

      {/* 3-column workspace */}
      <div className="doc-3col">

        {/* ── LEFT: Sidebar ──────────────────────────────────────────────── */}
        <FolderSidebar
          allFolders={allFolders}
          allDocs={allDocs}
          sidebarFilter={sidebarFilter}
          onFilterChange={f => { setSidebarFilter(f); setSelectedIds(new Set()); }}
          statusCat={statusCat}
          onCreateFolder={openFolderModal}
        />

        {/* ── CENTER: Main panel ─────────────────────────────────────────── */}
        <div className="doc-main">

          {/* Toolbar */}
          <div className="doc-toolbar">
            <div className="doc-toolbar-left">
              {breadcrumb && (
                <div className="doc-breadcrumb">
                  <button className="doc-bc-link" onClick={() => setSidebarFilter({ type:'all', clientId:null, folderId:null, status:'' })}>
                    All Documents
                  </button>
                  <i className="fas fa-chevron-right doc-bc-sep" />
                  <span>{breadcrumb}</span>
                </div>
              )}
              <span className="doc-doc-count">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="doc-toolbar-right">
              <div className="doc-search-wrap" style={{ width: 220 }}>
                <i className="fas fa-search" />
                <input
                  className="doc-search"
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="doc-view-toggle">
                <button className={`doc-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="List view">
                  <i className="fas fa-list" />
                </button>
                <button className={`doc-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                  <i className="fas fa-th-large" />
                </button>
              </div>
              <button className="doc-btn doc-btn-primary doc-btn-sm" onClick={() => openUpload('task')}>
                <i className="fas fa-cloud-upload-alt" /> Upload
              </button>
            </div>
          </div>

          {/* Batch bar */}
          {selectedIds.size > 0 && (
            <div className="doc-batch-bar">
              <div className="doc-batch-info">
                <i className="fas fa-check-circle" />
                <strong>{selectedIds.size}</strong> selected
              </div>
              <div className="doc-batch-actions">
                <button className="doc-batch-btn" onClick={handleBatchDownload}>
                  <i className="fas fa-download" /> Download All
                </button>
                <button className="doc-batch-btn danger" onClick={handleBatchDelete}>
                  <i className="fas fa-trash-alt" /> Delete
                </button>
                <button className="doc-batch-btn ghost" onClick={() => setSelectedIds(new Set())}>
                  <i className="fas fa-times" /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="doc-loading"><div className="doc-spinner" /> Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="doc-empty">
              <i className="fas fa-file-upload" />
              <strong>No documents found.</strong>
              <p>{search ? `No results for "${search}"` : 'Click "Upload" to add the first document.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <DocGrid
              docs={filteredDocs}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onPreview={doc => setPreviewDoc(doc)}
              onDownload={handleDownload}
              onDelete={openDelete}
              onView={doc => setViewerDoc(doc)}
            />
          ) : (
            /* LIST VIEW */
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Document</th>
                    <th>Client / Task</th>
                    <th>Folder</th>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign:'center', width:120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map(doc => {
                    const m   = extMeta(doc.extension);
                    const sel = selectedIds.has(doc.idDocument);
                    const lbl = doc.clientName || doc.clientTaskName || null;
                    return (
                      <tr
                        key={doc.idDocument}
                        className={`doc-tr${sel ? ' selected' : ''}${previewDoc?.idDocument === doc.idDocument ? ' previewing' : ''}`}
                        onClick={() => setPreviewDoc(doc)}
                        onDoubleClick={() => setViewerDoc(doc)}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={sel} onChange={() => toggleSelect(doc.idDocument)} />
                        </td>
                        <td>
                          <div className="doc-file-cell">
                            <div className={`doc-file-icon-sm ${m.bg}`}><i className={`fas ${m.icon}`} /></div>
                            <div>
                              <div className="doc-file-name">{doc.nameDocument}</div>
                              <div className="doc-file-ext">{doc.fileName || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="doc-client-cell">
                            {lbl && <span className="doc-client-name">{lbl}</span>}
                            {doc.taskName && <span className="doc-task-sub"><i className="fas fa-tasks" /> #{doc.idTask} {doc.taskName}</span>}
                          </div>
                        </td>
                        <td>{doc.folderName || <span style={{color:'#94a3b8'}}>—</span>}</td>
                        <td>{doc.assignedTo || '—'}</td>
                        <td><span className={`doc-badge ${m.badge}`}>{doc.statusDocument || '—'}</span></td>
                        <td style={{ whiteSpace:'nowrap' }}>{fmtDate(doc.creationDate)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="doc-row-actions">
                            <button className="doc-icon-btn doc-icon-btn-view" title="View" onClick={() => setViewerDoc(doc)}>
                              <i className="fas fa-eye" />
                            </button>
                            <button className="doc-icon-btn doc-icon-btn-dl" title="Download" onClick={() => handleDownload(doc)}>
                              <i className="fas fa-download" />
                            </button>
                            <button className="doc-icon-btn doc-icon-btn-delete" title="Delete" onClick={() => openDelete(doc)}>
                              <i className="fas fa-trash-alt" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RIGHT: Preview panel ────────────────────────────────────────── */}
        <PreviewPanel
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={handleDownload}
          onDelete={openDelete}
        />
      </div>

      {/* ══════════════════ UPLOAD MODAL ══════════════════════════════════════ */}
      {uploadOpen && (
        <div className="doc-overlay" onClick={e => e.target === e.currentTarget && !uploading && setUploadOpen(false)}>
          <div className="doc-modal doc-modal-xl">
            <div className="doc-modal-header">
              <h5><i className="fas fa-cloud-upload-alt" /> Upload Document</h5>
              <button className="doc-modal-close" onClick={() => !uploading && setUploadOpen(false)}>&times;</button>
            </div>

            <div className="doc-upload-panel">
              {/* Left: drop zone */}
              <div className="doc-upload-left">
                <div
                  ref={dropRef}
                  className={`doc-upload-zone${uploadDrag ? ' drag-over' : ''}${uploadFile ? ' has-file' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                >
                  <input type="file" onChange={handleFileInput} disabled={uploading} className="doc-upload-zone-input" />
                  {!uploadFile ? (
                    <>
                      <div className="doc-upload-zone-icon"><i className="fas fa-cloud-upload-alt" /></div>
                      <p className="doc-upload-zone-title">Drop your file here</p>
                      <p className="doc-upload-zone-sub">or <strong>click to browse</strong></p>
                      <div className="doc-upload-types"><span>PDF</span><span>Word</span><span>Excel</span><span>PPT</span><span>Image</span><span>ZIP</span></div>
                      <p className="doc-upload-zone-limit">Max 50 MB</p>
                    </>
                  ) : (
                    <div className="doc-upload-file-preview">
                      <div className={`doc-upload-file-icon ${extMeta(uploadFile.name.split('.').pop()).bg}`}>
                        <i className={`fas ${extMeta(uploadFile.name.split('.').pop()).icon}`} />
                      </div>
                      <div className="doc-upload-file-name">{uploadFile.name}</div>
                      <div className="doc-upload-file-size">
                        {uploadFile.size >= 1048576 ? (uploadFile.size / 1048576).toFixed(1) + ' MB' : (uploadFile.size / 1024).toFixed(0) + ' KB'}
                      </div>
                      {!uploading && (
                        <button className="doc-upload-file-change" onClick={e => { e.stopPropagation(); setUploadFile(null); setUploadForm(p => ({ ...p, nameDocument:'' })); }}>
                          <i className="fas fa-times" /> Change file
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="doc-upload-progress">
                    <div className="doc-upload-progress-track">
                      <div className="doc-upload-progress-fill" style={{ width:`${uploadPct}%` }} />
                    </div>
                    <div className="doc-upload-progress-label">
                      <span><i className="fas fa-spinner fa-spin" /> Uploading...</span>
                      <strong>{uploadPct}%</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: form */}
              <div className="doc-upload-right">
                <div className="doc-upload-mode-toggle">
                  <button className={`doc-upload-mode-btn${uploadMode === 'task' ? ' active' : ''}`}
                    onClick={() => { setUploadMode('task'); setModalTask(null); setModalClient(null); setTargetSearch(''); setUploadForm(p => ({ ...p, idFolder:'' })); }}>
                    <i className="fas fa-tasks" /> By Task
                  </button>
                  <button className={`doc-upload-mode-btn${uploadMode === 'client' ? ' active' : ''}`}
                    onClick={() => { setUploadMode('client'); setModalTask(null); setModalClient(null); setTargetSearch(''); setUploadForm(p => ({ ...p, idFolder:'' })); }}>
                    <i className="fas fa-user-tie" /> By Client
                  </button>
                </div>

                {/* Task picker */}
                {uploadMode === 'task' ? (
                  <div className="doc-field">
                    <label className="doc-label">Task <span className="doc-required">*</span></label>
                    {modalTask ? (
                      <div className="doc-upload-target-selected">
                        <div className="doc-upload-target-info">
                          <i className="fas fa-tasks" />
                          <div>
                            <div className="doc-upload-target-name">{modalTask.taskName}</div>
                            {modalTask.clientName && <div className="doc-upload-target-sub"><i className="fas fa-building" /> {modalTask.clientName}</div>}
                          </div>
                        </div>
                        <button className="doc-upload-target-clear" onClick={() => { setModalTask(null); setTargetSearch(''); }}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ) : (
                      <div className="doc-upload-target-picker">
                        <div className="doc-search-wrap" style={{ marginBottom:'.4rem' }}>
                          <i className="fas fa-search" />
                          <input className="doc-search" placeholder="Search task or client..." value={targetSearch} onChange={e => setTargetSearch(e.target.value)} autoFocus />
                        </div>
                        <div className="doc-upload-target-list">
                          {pickerTasks.length === 0 && <p style={{ color:'#94a3b8', fontSize:'.8rem', padding:'.5rem .75rem' }}>Loading tasks...</p>}
                          {pickerTasks
                            .filter(t => !targetSearch || (t.name||'').toLowerCase().includes(targetSearch.toLowerCase()) || (t.clientName||'').toLowerCase().includes(targetSearch.toLowerCase()))
                            .slice(0, 10).map(t => (
                            <button key={t.idTask} className="doc-upload-target-item" onClick={() => { setModalTask({ idTask:t.idTask, taskName:t.name, clientName:t.clientName||'', hasFolder:false, idFolder:null }); setTargetSearch(''); }}>
                              <i className="fas fa-tasks" style={{ color:'#4361ee' }} />
                              <div>
                                <div className="doc-upload-target-item-name">#{t.idTask} — {t.name}</div>
                                {t.clientName && <div className="doc-upload-target-item-sub"><i className="fas fa-building" /> {t.clientName}</div>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="doc-field">
                    <label className="doc-label">Client <span className="doc-required">*</span></label>
                    {modalClient ? (
                      <div className="doc-upload-target-selected">
                        <div className="doc-upload-target-info">
                          <i className="fas fa-user-tie" />
                          <div><div className="doc-upload-target-name">{modalClient.clientName}</div></div>
                        </div>
                        <button className="doc-upload-target-clear" onClick={() => { setModalClient(null); setTargetSearch(''); }}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ) : (
                      <div className="doc-upload-target-picker">
                        <div className="doc-search-wrap" style={{ marginBottom:'.4rem' }}>
                          <i className="fas fa-search" />
                          <input className="doc-search" placeholder="Search client..." value={targetSearch} onChange={e => setTargetSearch(e.target.value)} autoFocus />
                        </div>
                        <div className="doc-upload-target-list">
                          {pickerClients.length === 0 && <p style={{ color:'#94a3b8', fontSize:'.8rem', padding:'.5rem .75rem' }}>Loading clients...</p>}
                          {pickerClients
                            .filter(c => !targetSearch || (c.name||'').toLowerCase().includes(targetSearch.toLowerCase()))
                            .slice(0, 10).map(c => (
                            <button key={c.idClient} className="doc-upload-target-item" onClick={() => { setModalClient({ idClient:c.idClient, clientName:c.name }); setTargetSearch(''); }}>
                              <i className="fas fa-user-tie" style={{ color:'#10b981' }} />
                              <div><div className="doc-upload-target-item-name">{c.name}</div></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {uploadMsg.text && (
                  <div className={`doc-alert doc-alert-${uploadMsg.type}`}>
                    <i className={`fas fa-${uploadMsg.type === 'error' ? 'exclamation-circle' : 'check-circle'}`} /> {uploadMsg.text}
                  </div>
                )}

                {(uploadMode === 'task' ? modalTask : modalClient) && (
                  <>
                    <div className="doc-field">
                      <label className="doc-label">Document Name <span className="doc-required">*</span></label>
                      <input className="doc-input" type="text" maxLength={100} placeholder="Enter document name"
                        value={uploadForm.nameDocument} onChange={e => setUploadForm(p => ({ ...p, nameDocument: e.target.value }))} />
                    </div>
                    <div className="doc-upload-row2">
                      <div className="doc-field">
                        <label className="doc-label">Assigned To <span className="doc-required">*</span></label>
                        <select className="doc-select" value={uploadForm.idEmployee} onChange={e => setUploadForm(p => ({ ...p, idEmployee: e.target.value }))}>
                          <option value="">— Select employee —</option>
                          {employeeCat.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      </div>
                      <div className="doc-field">
                        <label className="doc-label">Status <span className="doc-required">*</span></label>
                        <select className="doc-select" value={uploadForm.idStatusDocument} onChange={e => setUploadForm(p => ({ ...p, idStatusDocument: e.target.value }))}>
                          <option value="">— Select status —</option>
                          {statusCat.map(s => <option key={s.idTabla} value={s.idTabla}>{s.description}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="doc-field">
                      <label className="doc-label">Destination Folder</label>
                      {uploadMode === 'task' && modalTask?.hasFolder ? (
                        <div className="doc-upload-folder-pill ok"><i className="fas fa-folder" /> Task folder — auto-assigned</div>
                      ) : allFolders.length === 0 ? (
                        <div className="doc-upload-folder-pill warn"><i className="fas fa-info-circle" /> No folder linked — saved without folder</div>
                      ) : (
                        <select className="doc-select" value={uploadForm.idFolder} onChange={e => setUploadForm(p => ({ ...p, idFolder: e.target.value }))}>
                          <option value="">— Optional: select folder —</option>
                          {(uploadMode === 'task' ? allFolders : folderOpts.length > 0 ? folderOpts : allFolders).map(f => (
                            <option key={f.idFolder} value={f.idFolder}>{f.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="doc-field">
                      <label className="doc-label">Description</label>
                      <textarea className="doc-textarea" maxLength={500} rows={3} placeholder="Optional notes..."
                        value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="doc-modal-footer">
              <button className="doc-btn doc-btn-secondary" onClick={() => !uploading && setUploadOpen(false)} disabled={uploading}>Cancel</button>
              <button className="doc-btn doc-btn-primary" onClick={handleUpload} disabled={uploading || !uploadFile}>
                <i className={`fas fa-${uploading ? 'spinner fa-spin' : 'cloud-upload-alt'}`} />
                {uploading ? `Uploading ${uploadPct}%…` : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ DELETE MODAL ══════════════════════════════════════ */}
      {deleteOpen && deleteDoc && (
        <div className="doc-overlay" onClick={e => e.target === e.currentTarget && !deleting && setDeleteOpen(false)}>
          <div className="doc-modal">
            <div className="doc-modal-header">
              <h5><i className="fas fa-trash-alt" style={{ color:'#ef4444' }} /> Delete Document</h5>
              <button className="doc-modal-close" onClick={() => !deleting && setDeleteOpen(false)}>&times;</button>
            </div>
            <div className="doc-modal-body">
              <div className="doc-delete-preview">
                <div className={`doc-delete-icon-wrap ${extMeta(deleteDoc.extension).bg}`}>
                  <i className={`fas ${extMeta(deleteDoc.extension).icon}`} />
                </div>
                <div className="doc-delete-info">
                  <div className="doc-delete-name">{deleteDoc.nameDocument}</div>
                  <div className="doc-delete-meta">{deleteDoc.fileName} · {fmtDate(deleteDoc.creationDate)}</div>
                </div>
              </div>
              <div className="doc-delete-warning">
                <i className="fas fa-exclamation-triangle" />
                This document will be deactivated. The physical file remains on the server.
              </div>
            </div>
            <div className="doc-modal-footer">
              <button className="doc-btn doc-btn-secondary" onClick={() => !deleting && setDeleteOpen(false)} disabled={deleting}>Cancel</button>
              <button className="doc-btn doc-btn-danger" onClick={handleDelete} disabled={deleting}>
                <i className={`fas fa-${deleting ? 'spinner fa-spin' : 'trash-alt'}`} />
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ STORAGE CONFIG MODAL ══════════════════════════════ */}
      {cfgOpen && (
        <div className="doc-overlay" onClick={e => e.target === e.currentTarget && !cfgSaving && setCfgOpen(false)}>
          <div className="doc-modal doc-modal-lg">
            <div className="doc-modal-header">
              <h5><i className="fas fa-cog" /> Storage Settings</h5>
              <button className="doc-modal-close" onClick={() => !cfgSaving && setCfgOpen(false)}>&times;</button>
            </div>
            <div className="doc-modal-body">
              {cfgMsg.text && (
                <div className={`doc-alert doc-alert-${cfgMsg.type}`}>
                  <i className={`fas fa-${cfgMsg.type === 'error' ? 'exclamation-circle' : 'check-circle'}`} /> {cfgMsg.text}
                </div>
              )}
              <div className="doc-cfg-help">
                <i className="fas fa-info-circle" />
                Available tokens: <code>{'{Year}'}</code> <code>{'{ClientName}'}</code> <code>{'{IdTask}'}</code> <code>{'{TaskName}'}</code>
              </div>
              <div className="doc-form-grid">
                <div className="doc-field doc-field-full">
                  <label className="doc-label">Base Path <span className="doc-required">*</span></label>
                  <input className="doc-input" type="text" placeholder="Z:\CENTRAL FILE A&E TAXES\CLIENTS"
                    value={cfgForm.basePath} onChange={e => setCfgForm(p => ({ ...p, basePath: e.target.value }))} />
                </div>
                <div className="doc-field doc-field-full">
                  <label className="doc-label">Task Folder Template</label>
                  <input className="doc-input" type="text" placeholder="{Year}\{ClientName}\Task-{IdTask}"
                    value={cfgForm.taskTemplate} onChange={e => setCfgForm(p => ({ ...p, taskTemplate: e.target.value }))} />
                  <small className="doc-hint">Preview: {(cfgForm.taskTemplate||'{Year}\\{ClientName}\\Task-{IdTask}').replace('{Year}','2024').replace('{ClientName}','ACOSTA, ANGELICA').replace('{IdTask}','1001').replace('{TaskName}','TAX RETURN')}</small>
                </div>
                <div className="doc-field doc-field-full">
                  <label className="doc-label">Client (General) Folder Template</label>
                  <input className="doc-input" type="text" placeholder="{ClientName}\GENERAL"
                    value={cfgForm.clientTemplate} onChange={e => setCfgForm(p => ({ ...p, clientTemplate: e.target.value }))} />
                  <small className="doc-hint">Preview: {(cfgForm.clientTemplate||'{ClientName}\\GENERAL').replace('{ClientName}','SCRUBS JANITORIAL, INC')}</small>
                </div>
              </div>
            </div>
            <div className="doc-modal-footer">
              <button className="doc-btn doc-btn-secondary" onClick={() => !cfgSaving && setCfgOpen(false)} disabled={cfgSaving}>Cancel</button>
              <button className="doc-btn doc-btn-primary" onClick={handleSaveConfig} disabled={cfgSaving}>
                <i className={`fas fa-${cfgSaving ? 'spinner fa-spin' : 'save'}`} />
                {cfgSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ VIEWER MODAL ═════════════════════════════════════ */}
      {viewerDoc && (
        <ViewerModal
          doc={viewerDoc}
          onClose={() => setViewerDoc(null)}
          onDownload={handleDownload}
        />
      )}

      {/* ══════════════════ CREATE FOLDER MODAL ══════════════════════════════ */}
      {folderModalOpen && (
        <div className="doc-overlay" onClick={e => e.target === e.currentTarget && !folderModalSaving && setFolderModalOpen(false)}>
          <div className="doc-modal">
            <div className="doc-modal-header">
              <h5><i className="fas fa-folder-plus" /> Create Folder</h5>
              <button className="doc-modal-close" onClick={() => !folderModalSaving && setFolderModalOpen(false)}>&times;</button>
            </div>
            <div className="doc-modal-body">
              <div className="doc-upload-mode-toggle">
                <button className={`doc-upload-mode-btn${folderModalMode === 'client' ? ' active' : ''}`}
                  onClick={() => { setFolderModalMode('client'); setFolderModalTarget(null); setFolderModalSearch(''); }}>
                  <i className="fas fa-user-tie" /> By Client
                </button>
                <button className={`doc-upload-mode-btn${folderModalMode === 'task' ? ' active' : ''}`}
                  onClick={() => { setFolderModalMode('task'); setFolderModalTarget(null); setFolderModalSearch(''); }}>
                  <i className="fas fa-tasks" /> By Task
                </button>
              </div>

              <div className="doc-field">
                <label className="doc-label">
                  {folderModalMode === 'client' ? 'Client' : 'Task'} <span className="doc-required">*</span>
                </label>
                {folderModalTarget ? (
                  <div className="doc-upload-target-selected">
                    <div className="doc-upload-target-info">
                      <i className={`fas ${folderModalMode === 'client' ? 'fa-user-tie' : 'fa-tasks'}`} />
                      <div><div className="doc-upload-target-name">{folderModalTarget.name}</div></div>
                    </div>
                    <button className="doc-upload-target-clear" onClick={() => { setFolderModalTarget(null); setFolderModalSearch(''); }}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ) : (
                  <div className="doc-upload-target-picker">
                    <div className="doc-search-wrap" style={{ marginBottom:'.4rem' }}>
                      <i className="fas fa-search" />
                      <input className="doc-search" placeholder={`Search ${folderModalMode}...`}
                        value={folderModalSearch} onChange={e => setFolderModalSearch(e.target.value)} autoFocus />
                    </div>
                    <div className="doc-upload-target-list">
                      {folderModalMode === 'client'
                        ? pickerClients
                            .filter(c => !folderModalSearch || c.name.toLowerCase().includes(folderModalSearch.toLowerCase()))
                            .slice(0,10).map(c => (
                            <button key={c.idClient} className="doc-upload-target-item"
                              onClick={() => { setFolderModalTarget({ id:c.idClient, name:c.name }); setFolderModalSearch(''); }}>
                              <i className="fas fa-user-tie" style={{ color:'#10b981' }} />
                              <div><div className="doc-upload-target-item-name">{c.name}</div></div>
                            </button>
                          ))
                        : pickerTasks
                            .filter(t => !folderModalSearch || (t.name||'').toLowerCase().includes(folderModalSearch.toLowerCase()) || (t.clientName||'').toLowerCase().includes(folderModalSearch.toLowerCase()))
                            .slice(0,10).map(t => (
                            <button key={t.idTask} className="doc-upload-target-item"
                              onClick={() => { setFolderModalTarget({ id:t.idTask, name:`#${t.idTask} — ${t.name}` }); setFolderModalSearch(''); }}>
                              <i className="fas fa-tasks" style={{ color:'#4361ee' }} />
                              <div>
                                <div className="doc-upload-target-item-name">#{t.idTask} — {t.name}</div>
                                {t.clientName && <div className="doc-upload-target-item-sub"><i className="fas fa-building" /> {t.clientName}</div>}
                              </div>
                            </button>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="doc-field">
                <label className="doc-label">Folder Name <span className="doc-required">*</span></label>
                <input className="doc-input" type="text" maxLength={100}
                  placeholder="e.g. 2024, Legal Documents, Tax Return..."
                  value={folderModalName} onChange={e => setFolderModalName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
              </div>

              {folderModalMsg.text && (
                <div className={`doc-alert doc-alert-${folderModalMsg.type}`}>
                  <i className={`fas fa-${folderModalMsg.type === 'error' ? 'exclamation-circle' : 'check-circle'}`} /> {folderModalMsg.text}
                </div>
              )}

              <div className="doc-alert" style={{ background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1' }}>
                <i className="fas fa-info-circle" />
                The folder will be created on the server using your storage settings path.
              </div>
            </div>
            <div className="doc-modal-footer">
              <button className="doc-btn doc-btn-secondary" onClick={() => !folderModalSaving && setFolderModalOpen(false)} disabled={folderModalSaving}>Cancel</button>
              <button className="doc-btn doc-btn-primary" onClick={handleCreateFolder} disabled={folderModalSaving}>
                <i className={`fas fa-${folderModalSaving ? 'spinner fa-spin' : 'folder-plus'}`} />
                {folderModalSaving ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
