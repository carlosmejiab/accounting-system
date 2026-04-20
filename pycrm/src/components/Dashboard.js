// ===================================
// COMPONENTE: DASHBOARD
// ===================================

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Users from './Users';
import Profiles from './Profiles';
import Clients from './Clients';
import Tasks from './Tasks';
import Contacts from './Contacts';
import ClientAccount from './ClientAccount';
import Events from './Events';
import Employees from './Employees';
import Documents from './Documents';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

function Dashboard() {
  
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('user-management');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log('📄 Navegando a:', page);
  };

const renderContent = () => {
  switch (currentPage) {
    // Módulos principales implementados
    case 'user-management':
      return <UserManagementContent />;
    case 'permissions':
      return <PermissionsContent />;
    
    // CUSTOMER REGISTRATION - Submenús
    case 'customer-register':
      return <CustomerRegisterContent />;
    case 'customer-contact':
      return <CustomerContactContent />;
    case 'customer-client-account':
      return <CustomerClientAccountContent />;
    
    // Otros módulos principales
    case 'task-register':
      return <TaskRegisterContent />;
    case 'event-log':
      return <EventLogContent />;
    case 'tracking':
      return <TrackingContent />;
    case 'customer-documents':
      return <CustomerDocumentsContent />;
    
    // MAINTENANCE - Submenús
    case 'maintenance-city':
      return <MaintenanceCityContent />;
    case 'maintenance-contact':
      return <MaintenanceContactContent />;
    case 'maintenance-employees':
      return <MaintenanceEmployeesContent />;
    case 'maintenance-extensions':
      return <MaintenanceExtensionsContent />;
    case 'maintenance-locations':
      return <MaintenanceLocationsContent />;
    case 'maintenance-positions':
      return <MaintenancePositionsContent />;
    case 'maintenance-priority':
      return <MaintenancePriorityContent />;
    case 'maintenance-prof-permiss':
      return <MaintenanceProfPermissContent />;
    case 'maintenance-services':
      return <MaintenanceServicesContent />;
    case 'maintenance-state':
      return <MaintenanceStateContent />;
    case 'maintenance-subtask':
      return <MaintenanceSubTaskContent />;
    case 'maintenance-task':
      return <MaintenanceTaskContent />;
    case 'maintenance-type-client':
      return <MaintenanceTypeClientContent />;
    
    // REPORTS - Submenús
    case 'reports-bookkeeping':
      return <ReportsBookkeepingContent />;
    case 'reports-tasks-by-client':
      return <ReportsTasksByClientContent />;
    case 'reports-event':
      return <ReportsEventContent />;
    case 'reports-tasks':
      return <ReportsTasksContent />;
    case 'reports-gl-wc':
      return <ReportsGLWCContent />;
    case 'reports-tracking':
      return <ReportsTrackingContent />;
    
    default:
      return <UserManagementContent />;
  }
};

  return (
    <div className="dashboard-layout">
      
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar user={user} />
        <div className="content-area">
          {renderContent()}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;

// ===================================
// CONTENIDOS DE MÓDULOS
// ===================================

function UserManagementContent() {
  return <Users />;
}

function PermissionsContent() {
  return <Profiles />;
}

// ===================================
// CUSTOMER REGISTRATION - SUBMENÚS
// ===================================

// ✅ CORREGIDO: Ahora renderiza el componente Clients
function CustomerRegisterContent() {
  return <Clients />;
}

function CustomerContactContent() {
  return <Contacts />;
}

function CustomerClientAccountContent() {
  return <ClientAccount />;
}

// ===================================
// OTROS MÓDULOS
// ===================================

function TaskRegisterContent() {
  return <Tasks />;
}

function EventLogContent() {
  return <Events />;
}

function TrackingContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item active">Tracking</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-map-marker-alt me-2"></i>
            Tracking
          </h4>
        </div>
        <p className="text-muted">Seguimiento y localización en tiempo real</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás rastrear ubicaciones y ver el mapa en tiempo real.
        </div>

        <div className="row g-3 mt-3">
          <div className="col-md-4">
            <div className="stat-card bg-success">
              <div className="stat-icon">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <div className="stat-content">
                <h3>0</h3>
                <p>Ubicaciones Activas</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card bg-warning">
              <div className="stat-icon">
                <i className="fas fa-truck"></i>
              </div>
              <div className="stat-content">
                <h3>0</h3>
                <p>En Tránsito</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card bg-info">
              <div className="stat-icon">
                <i className="fas fa-route"></i>
              </div>
              <div className="stat-content">
                <h3>0</h3>
                <p>Rutas Activas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDocumentsContent() {
  return <Documents />;
}

// ===================================
// MAINTENANCE - SUBMENÚS
// ===================================

function MaintenanceCityContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">City</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-city me-2"></i>
            City Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de ciudades</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar el catálogo de ciudades.
        </div>
      </div>
    </div>
  );
}

function MaintenanceContactContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Contact</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-phone me-2"></i>
            Contact Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de contactos</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar tipos de contactos.
        </div>
      </div>
    </div>
  );
}

function MaintenanceEmployeesContent() {
  return <Employees />;
}

function MaintenanceExtensionsContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Extensions</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-phone-volume me-2"></i>
            Extensions Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de extensiones telefónicas</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar extensiones.
        </div>
      </div>
    </div>
  );
}

function MaintenanceLocationsContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Locations</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-map-marked-alt me-2"></i>
            Locations Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de ubicaciones</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar ubicaciones.
        </div>
      </div>
    </div>
  );
}

function MaintenancePositionsContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Positions</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-briefcase me-2"></i>
            Positions Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de puestos de trabajo</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar puestos.
        </div>
      </div>
    </div>
  );
}

function MaintenancePriorityContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Priority</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-exclamation-circle me-2"></i>
            Priority Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de niveles de prioridad</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar prioridades.
        </div>
      </div>
    </div>
  );
}

function MaintenanceProfPermissContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Prof/Permiss</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-user-shield me-2"></i>
            Prof/Permiss Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de profesiones y permisos</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar profesiones y permisos.
        </div>
      </div>
    </div>
  );
}

function MaintenanceServicesContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Services</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-concierge-bell me-2"></i>
            Services Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de servicios</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar servicios.
        </div>
      </div>
    </div>
  );
}

function MaintenanceStateContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">State</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-flag me-2"></i>
            State Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de estados</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar estados.
        </div>
      </div>
    </div>
  );
}

function MaintenanceSubTaskContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">SubTask</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-list-ul me-2"></i>
            SubTask Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de subtareas</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar subtareas.
        </div>
      </div>
    </div>
  );
}

function MaintenanceTaskContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Task</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-tasks me-2"></i>
            Task Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de tareas</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar tipos de tareas.
        </div>
      </div>
    </div>
  );
}

function MaintenanceTypeClientContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Maintenance</a></li>
          <li className="breadcrumb-item active">Type Client</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-tags me-2"></i>
            Type Client Maintenance
          </h4>
        </div>
        <p className="text-muted">Gestión de tipos de clientes</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás gestionar tipos de clientes.
        </div>
      </div>
    </div>
  );
}

// ===================================
// REPORTS - SUBMENÚS
// ===================================

function ReportsBookkeepingContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">Bookkeeping Status</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-book me-2"></i>
            Bookkeeping Status Report
          </h4>
        </div>
        <p className="text-muted">Reporte de estado de contabilidad</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás generar reportes de contabilidad.
        </div>
      </div>
    </div>
  );
}

function ReportsTasksByClientContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">Tasks By Client</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-user-check me-2"></i>
            Tasks By Client Report
          </h4>
        </div>
        <p className="text-muted">Reporte de tareas por cliente</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás ver tareas agrupadas por cliente.
        </div>
      </div>
    </div>
  );
}

function ReportsEventContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">Event Report</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-calendar-alt me-2"></i>
            Event Report
          </h4>
        </div>
        <p className="text-muted">Reporte de eventos</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás generar reportes de eventos.
        </div>
      </div>
    </div>
  );
}

function ReportsTasksContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">Tasks Report</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-clipboard-check me-2"></i>
            Tasks Report
          </h4>
        </div>
        <p className="text-muted">Reporte general de tareas</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás generar reportes de tareas.
        </div>
      </div>
    </div>
  );
}

function ReportsGLWCContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">GL/WC Audit</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-file-invoice-dollar me-2"></i>
            GL/WC Audit Report
          </h4>
        </div>
        <p className="text-muted">Reporte de auditoría GL/WC</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás generar reportes de auditoría.
        </div>
      </div>
    </div>
  );
}

function ReportsTrackingContent() {
  return (
    <div className="content-wrapper fade-in">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#!">Inicio</a></li>
          <li className="breadcrumb-item"><a href="#!">Reports</a></li>
          <li className="breadcrumb-item active">Tracking Report</li>
        </ol>
      </nav>

      <div className="content-card">
        <div className="card-header">
          <h4>
            <i className="fas fa-route me-2"></i>
            Tracking Report
          </h4>
        </div>
        <p className="text-muted">Reporte de seguimiento</p>
        <hr />
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Módulo en desarrollo.</strong> Aquí podrás generar reportes de tracking.
        </div>
      </div>
    </div>
  );
}