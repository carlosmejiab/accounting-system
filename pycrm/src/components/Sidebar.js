// ===================================
// COMPONENTE: SIDEBAR CON SUBMENÚS
// ===================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function Sidebar({ collapsed, onToggle, currentPage, onPageChange }) {
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar qué menús están expandidos
  const [expandedMenus, setExpandedMenus] = useState({});

  // ===================================
  // ESTRUCTURA DEL MENÚ CON SUBMENÚS
  // ===================================
  const menuItems = [
    {
      id: 'user-management',
      label: 'User Management',
      icon: 'fas fa-users',
      page: 'user-management'
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: 'fas fa-key',
      page: 'permissions'
    },
    {
      id: 'customer-registration',
      label: 'Customer Registration',
      icon: 'fas fa-user-plus',
      hasSubmenu: true,
      submenu: [
        { id: 'register', label: 'Register', page: 'customer-register' },
        { id: 'contact', label: 'Contact', page: 'customer-contact' },
        { id: 'client-account', label: 'Client Account', page: 'customer-client-account' }
      ]
    },
    {
      id: 'task-register',
      label: 'Task Register',
      icon: 'fas fa-tasks',
      page: 'task-register'
    },
    {
      id: 'event-log',
      label: 'Event Log',
      icon: 'fas fa-clipboard-list',
      page: 'event-log'
    },
    {
      id: 'tracking',
      label: 'Tracking',
      icon: 'fas fa-map-marker-alt',
      page: 'tracking'
    },
    {
      id: 'customer-documents',
      label: 'Customer Documents',
      icon: 'fas fa-folder-open',
      page: 'customer-documents'
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: 'fas fa-tools',
      hasSubmenu: true,
      submenu: [
        { id: 'city', label: 'City', page: 'maintenance-city' },
        { id: 'contact', label: 'Contact', page: 'maintenance-contact' },
        { id: 'employees', label: 'Employees', page: 'maintenance-employees' },
        { id: 'extensions', label: 'Extensions', page: 'maintenance-extensions' },
        { id: 'locations', label: 'Locations', page: 'maintenance-locations' },
        { id: 'positions', label: 'Positions', page: 'maintenance-positions' },
        { id: 'priority', label: 'Priority', page: 'maintenance-priority' },
        { id: 'prof-permiss', label: 'Prof/Permiss', page: 'maintenance-prof-permiss' },
        { id: 'services', label: 'Services', page: 'maintenance-services' },
        { id: 'state', label: 'State', page: 'maintenance-state' },
        { id: 'subtask', label: 'SubTask', page: 'maintenance-subtask' },
        { id: 'task', label: 'Task', page: 'maintenance-task' },
        { id: 'type-client', label: 'Type Client', page: 'maintenance-type-client' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'fas fa-chart-bar',
      hasSubmenu: true,
      submenu: [
        { id: 'bookkeeping', label: 'Bookkeeping Status Report', page: 'reports-bookkeeping' },
        { id: 'tasks-by-client', label: 'Tasks By Client Report', page: 'reports-tasks-by-client' },
        { id: 'event', label: 'Event Report', page: 'reports-event' },
        { id: 'tasks', label: 'Tasks Report', page: 'reports-tasks' },
        { id: 'gl-wc', label: 'GL/WC Audit Report', page: 'reports-gl-wc' },
        { id: 'tracking', label: 'Tracking Report', page: 'reports-tracking' }
      ]
    }
  ];

  // Toggle de expansión de submenú
  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
      console.log('✅ Sesión cerrada');
    }
  };

  const handleMenuClick = (page, hasSubmenu, menuId) => {
    if (hasSubmenu) {
      toggleSubmenu(menuId);
    } else {
      onPageChange(page);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fas fa-cube me-2"></i>
          {!collapsed && <span>Mi Aplicación</span>}
        </div>
        
        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <i className={`fas fa-${collapsed ? 'angle-right' : 'angle-left'}`}></i>
        </button>
      </div>

      <div className="sidebar-user">
        <img 
          src={user.avatar} 
          alt={user.nombre}
          className="user-avatar"
        />
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user.nombre}</div>
            <div className="user-role">{user.rol}</div>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        <ul className="menu-list">
          
          {menuItems.map((item) => (
            <li key={item.id} className="menu-item">
              
              {/* Menú principal */}
              <button
                className={`menu-link ${currentPage === item.page ? 'active' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
                onClick={() => handleMenuClick(item.page, item.hasSubmenu, item.id)}
                title={collapsed ? item.label : ''}
              >
                <i className={item.icon}></i>
                {!collapsed && <span>{item.label}</span>}
                
                {/* Icono de expansión para submenús */}
                {item.hasSubmenu && !collapsed && (
                  <i className={`fas fa-chevron-${expandedMenus[item.id] ? 'down' : 'right'} submenu-arrow`}></i>
                )}
              </button>

              {/* Submenú */}
              {item.hasSubmenu && !collapsed && expandedMenus[item.id] && (
                <ul className="submenu-list">
                  {item.submenu.map((subitem) => (
                    <li key={subitem.id} className="submenu-item">
                      <button
                        className={`submenu-link ${currentPage === subitem.page ? 'active' : ''}`}
                        onClick={() => onPageChange(subitem.page)}
                      >
                        <i className="fas fa-angle-right me-2"></i>
                        <span>{subitem.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

            </li>
          ))}

          <li className="menu-separator"></li>

          <li className="menu-item">
            <button
              className="menu-link logout-link"
              onClick={handleLogout}
              title={collapsed ? 'Cerrar Sesión' : ''}
            >
              <i className="fas fa-sign-out-alt"></i>
              {!collapsed && <span>Cerrar Sesión</span>}
            </button>
          </li>

        </ul>
      </nav>

    </aside>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  currentPage: PropTypes.string,
  onPageChange: PropTypes.func
};

export default Sidebar;