// ===================================
// COMPONENTE: NAVBAR
// ===================================
/**
 * Componente de la barra de navegación superior
 * Muestra notificaciones y menú de usuario
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

function Navbar({ user }) {
  
  // ===================================
  // HOOKS Y ESTADOS
  // ===================================
  
  /**
   * navigate: Para redirigir a otras páginas
   */
  const navigate = useNavigate();
  
  /**
   * logout: Función para cerrar sesión del contexto
   */
  const { logout } = useAuth();
  
  /**
   * showUserMenu: Controla si el menú desplegable del usuario está visible
   */
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  /**
   * toggleUserMenu: Alterna la visibilidad del menú de usuario
   */
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  /**
   * handleLogout: Maneja el cierre de sesión
   */
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  /**
   * handleNotifications: Maneja el click en el botón de notificaciones
   */
  const handleNotifications = () => {
    alert('Sistema de notificaciones en desarrollo');
    // Aquí puedes abrir un modal con las notificaciones
  };

  // ===================================
  // RENDERIZADO
  // ===================================

  return (
    <nav className="top-navbar">
      
      {/* Lado Izquierdo: Título */}
      <div className="navbar-left">
        <h2 className="navbar-title">
          <i className="fas fa-home me-2"></i>
          Dashboard
        </h2>
      </div>

      {/* Lado Derecho: Acciones */}
      <div className="navbar-right">
        
        {/* Botón de Notificaciones */}
        <button 
          className="navbar-btn"
          onClick={handleNotifications}
          title="Notificaciones"
        >
          <i className="fas fa-bell"></i>
        </button>

        {/* Menú de Usuario */}
        <div className="user-menu-wrapper">
          
          {/* Botón del Usuario */}
          <button 
            className="user-menu-trigger"
            onClick={toggleUserMenu}
          >
            <img 
              src={user.avatar} 
              alt={user.nombre}
              className="user-avatar-small"
            />
            <div className="user-info-small">
              <div className="user-name-small">{user.nombre}</div>
              <div className="user-role-small">{user.rol}</div>
            </div>
            <i className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'} ms-2`}></i>
          </button>

          {/* Menú Desplegable */}
          {showUserMenu && (
            <div className="user-dropdown">
              <ul className="dropdown-menu">
                
                <li className="dropdown-header">
                  <div className="dropdown-user-info">
                    <img 
                      src={user.avatar} 
                      alt={user.nombre}
                      className="user-avatar-dropdown"
                    />
                    <div>
                      <div className="dropdown-user-name">{user.nombre}</div>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                  </div>
                </li>

                <li className="dropdown-divider"></li>

                <li>
                  <a 
                    href="#!" 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Perfil en desarrollo');
                    }}
                  >
                    <i className="fas fa-user me-2"></i>
                    Mi Perfil
                  </a>
                </li>

                <li>
                  <a 
                    href="#!" 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Configuración en desarrollo');
                    }}
                  >
                    <i className="fas fa-cog me-2"></i>
                    Configuración
                  </a>
                </li>

                <li className="dropdown-divider"></li>

                <li>
                  <button 
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Cerrar Sesión
                  </button>
                </li>

              </ul>
            </div>
          )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;

// ===================================
// EXPLICACIÓN DE CONCEPTOS
// ===================================

/**
 * ¿Qué es el renderizado condicional?
 * - Mostrar u ocultar elementos basándose en condiciones
 * - Se usa el operador && o el operador ternario ? :
 * 
 * Ejemplos:
 * 
 * 1. Operador && (mostrar solo si es verdadero):
 * {showMenu && <div>Menu</div>}
 * 
 * 2. Operador ternario (si/sino):
 * {isActive ? <span>Activo</span> : <span>Inactivo</span>}
 * 
 * 3. Múltiples condiciones:
 * {count > 0 && <span className="badge">{count}</span>}
 */

/**
 * ¿Qué es el event bubbling?
 * - Los eventos se propagan hacia arriba en el DOM
 * - Un click en un elemento hijo también dispara el evento en el padre
 * - e.preventDefault() previene el comportamiento por defecto
 * - e.stopPropagation() detiene la propagación
 * 
 * Ejemplo:
 * <a href="#!" onClick={(e) => {
 *   e.preventDefault();  // Evita que el link navegue
 *   // Tu código aquí
 * }}>
 */

/**
 * ¿Cómo cerrar un dropdown al hacer click fuera?
 * En producción, usarías useEffect con event listeners:
 * 
 * useEffect(() => {
 *   function handleClickOutside(event) {
 *     if (menuRef.current && !menuRef.current.contains(event.target)) {
 *       setShowUserMenu(false);
 *     }
 *   }
 *   
 *   document.addEventListener('mousedown', handleClickOutside);
 *   return () => {
 *     document.removeEventListener('mousedown', handleClickOutside);
 *   };
 * }, []);
 */

/**
 * ¿Qué son los badges?
 * - Pequeños indicadores visuales
 * - Comúnmente usados para contar notificaciones
 * - Se posicionan absolute sobre otro elemento
 * 
 * CSS:
 * .notification-badge {
 *   position: absolute;
 *   top: -5px;
 *   right: -5px;
 * }
 */
// Añadir PropTypes para validar props y subsprops
Navbar.propTypes = {
  user: PropTypes.shape({
    avatar: PropTypes.string,
    nombre: PropTypes.string,
    email: PropTypes.string,
    rol: PropTypes.string
  })
};
