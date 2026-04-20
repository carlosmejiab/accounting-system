// ===================================
// COMPONENTE: LOGIN
// ===================================
/**
 * Componente de inicio de sesión
 * Permite a los usuarios autenticarse en la aplicación
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  
  // ===================================
  // HOOKS
  // ===================================
  
  /**
   * useNavigate: Hook de React Router para navegar entre páginas
   * Reemplaza el antiguo useHistory
   */
  const navigate = useNavigate();
  
  /**
   * useAuth: Hook personalizado que nos da acceso a la autenticación
   * Obtenemos la función login del contexto
   */
  const { login } = useAuth();

  // ===================================
  // ESTADOS LOCALES
  // ===================================
  
  /**
   * username: Almacena el valor del campo de usuario
   */
  const [username, setUsername] = useState('');
  
  /**
   * password: Almacena el valor del campo de contraseña
   */
  const [password, setPassword] = useState('');
  
  /**
   * showPassword: Controla si la contraseña es visible o no
   */
  const [showPassword, setShowPassword] = useState(false);
  
  /**
   * error: Almacena mensajes de error
   * null = sin error
   * string = mensaje de error a mostrar
   */
  const [error, setError] = useState(null);
  
  /**
   * loading: Indica si se está procesando el login
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * rememberMe: Indica si el usuario marcó "Recordar"
   */
  const [rememberMe, setRememberMe] = useState(false);

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  /**
   * handleSubmit: Maneja el envío del formulario de login
   * 
   * @param {Event} e - Evento del formulario
   */
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  
  // Validar campos vacíos
  if (!username.trim()) {
    setError('Por favor ingresa tu usuario');
    return;
  }
  
  if (!password) {
    setError('Por favor ingresa tu contraseña');
    return;
  }
  
  // Marcar como cargando
  setLoading(true);
  
  try {
    // Llamar a la función login (ahora es async)
    const resultado = await login(username, password);
    
    if (resultado.success) {
      console.log('✅ Login exitoso');
      
      // Guardar usuario recordado si marcó la opción
      if (rememberMe) {
        localStorage.setItem('usuarioRecordado', username);
      } else {
        localStorage.removeItem('usuarioRecordado');
      }
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } else {
      // Mostrar error del servidor
      setError(resultado.message);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    setError('Error inesperado. Por favor intenta de nuevo.');
  } finally {
    // Siempre quitar el loading
    setLoading(false);
  }
};

  /**
   * togglePasswordVisibility: Alterna entre mostrar/ocultar contraseña
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ===================================
  // EFECTO: CARGAR USUARIO RECORDADO
  // ===================================
  
  /**
   * Al montar el componente, verificar si hay un usuario recordado
   */
  React.useEffect(() => {
    const usuarioRecordado = localStorage.getItem('usuarioRecordado');
    if (usuarioRecordado) {
      setUsername(usuarioRecordado);
      setRememberMe(true);
    }
  }, []);

  // ===================================
  // RENDERIZADO
  // ===================================
  
  return (
    <div className="login-container">
      <div className="login-wrapper">
        
        {/* Card del formulario */}
        <div className="login-card">
          
          {/* Logo y título */}
          <div className="login-header">
            <div className="login-logo">
              <i className="fas fa-user-circle"></i>
            </div>
            <h2>Bienvenido</h2>
            <p className="text-muted">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form">
            
            {/* Campo: Usuario */}
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <span 
                  className="input-icon input-icon-right"
                  onClick={togglePasswordVisibility}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </span>
              </div>
            </div>

            {/* Checkbox: Recordar */}
            <div className="form-check">
              <input
                type="checkbox"
                id="rememberMe"
                className="form-check-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="form-check-label">
                Recordar usuario
              </label>
            </div>

            {/* Mostrar error si existe */}
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Botón de submit */}
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Iniciar Sesión
                </>
              )}
            </button>

            {/* Link: Olvidé mi contraseña */}
            <div className="text-center mt-3">
              <a href="#" className="text-link">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

          </form>

          {/* Información de credenciales de prueba */}
          <div className="login-footer">
            <div className="alert alert-info">
              <strong>Credenciales de prueba:</strong><br />
              <code>Usuario: admin | Contraseña: admin123</code><br />
              <code>Usuario: usuario | Contraseña: usuario123</code>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}

export default Login;

// ===================================
// EXPLICACIÓN DE CONCEPTOS
// ===================================

/**
 * ¿Qué son los componentes funcionales?
 * - Funciones de JavaScript que retornan JSX (HTML en JavaScript)
 * - Son la forma moderna de crear componentes en React
 * - Pueden usar Hooks (useState, useEffect, etc.)
 * 
 * Antes (componentes de clase):
 * class Login extends Component {
 *   constructor() { ... }
 *   render() { return <div>...</div> }
 * }
 * 
 * Ahora (componentes funcionales):
 * function Login() {
 *   return <div>...</div>
 * }
 */

/**
 * ¿Qué es JSX?
 * - Extensión de sintaxis de JavaScript
 * - Permite escribir HTML dentro de JavaScript
 * - Se compila a JavaScript puro
 * 
 * Ejemplo:
 * const elemento = <h1>Hola Mundo</h1>;
 * Se compila a:
 * const elemento = React.createElement('h1', null, 'Hola Mundo');
 */

/**
 * ¿Qué son los eventos en React?
 * - Similar a eventos HTML pero en camelCase
 * - onClick en lugar de onclick
 * - onChange en lugar de onchange
 * - Se pasan funciones, no strings
 * 
 * HTML: <button onclick="miFuncion()">Click</button>
 * React: <button onClick={miFuncion}>Click</button>
 */

/**
 * ¿Qué es el controlled component?
 * - Componente cuyo valor es controlado por el estado de React
 * - El estado es la "fuente de verdad"
 * 
 * <input 
 *   value={username}              // Valor controlado por estado
 *   onChange={(e) => setUsername(e.target.value)}  // Actualiza el estado
 * />
 */

/**
 * ¿Por qué preventDefault()?
 * - Los formularios HTML recargan la página por defecto
 * - preventDefault() evita ese comportamiento
 * - Permite manejar el envío con JavaScript
 */
