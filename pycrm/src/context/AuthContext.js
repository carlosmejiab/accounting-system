// ===================================
// CONTEXT API - MANEJO DE AUTENTICACIÓN GLOBAL
// ===================================
/**
 * Este archivo maneja el estado de autenticación de toda la aplicación
 * usando Context API de React.
 * 
 * Context API permite compartir datos entre componentes sin pasar props
 * manualmente en cada nivel.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';  // ← AGREGAR ESTA LÍNEA

// ===================================
// CREAR EL CONTEXTO
// ===================================
/**
 * AuthContext: Contexto que contendrá la información de autenticación
 * Se crea vacío y se llenará con el AuthProvider
 */
const AuthContext = createContext(null);

// ===================================
// USUARIOS DE PRUEBA
// ===================================
/**
 * Datos de usuarios para desarrollo
 * En producción, estos vendrían de tu API .NET
 */
const USUARIOS_PRUEBA = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    nombre: 'Administrador',
    email: 'admin@miapp.com',
    rol: 'Administrador',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff'
  },
  {
    id: 2,
    username: 'usuario',
    password: 'usuario123',
    nombre: 'Usuario Demo',
    email: 'usuario@miapp.com',
    rol: 'Usuario',
    avatar: 'https://ui-avatars.com/api/?name=Usuario&background=764ba2&color=fff'
  }
];

// ===================================
// PROVIDER DEL CONTEXTO
// ===================================
/**
 * AuthProvider: Componente que provee el contexto de autenticación a toda la app
 * 
 * @param {Object} children - Componentes hijos que tendrán acceso al contexto
 */
export function AuthProvider({ children }) {
  
  // ===================================
  // ESTADOS
  // ===================================
  /**
   * user: Almacena los datos del usuario autenticado
   * null = no hay usuario logueado
   * Object = usuario logueado con sus datos
   */
  const [user, setUser] = useState(null);
  
  /**
   * loading: Indica si se está cargando la sesión desde localStorage
   * true = cargando
   * false = ya terminó de cargar
   */
  const [loading, setLoading] = useState(true);

  // ===================================
  // EFECTO: CARGAR SESIÓN AL INICIAR
  // ===================================
  /**
   * useEffect: Se ejecuta una vez cuando el componente se monta
   * Verifica si hay una sesión guardada en localStorage
   */
  useEffect(() => {
    // Intentar cargar la sesión guardada
    cargarSesion();
  }, []); // [] = solo se ejecuta una vez al montar

  // ===================================
  // FUNCIÓN: CARGAR SESIÓN
  // ===================================
  /**
   * Intenta recuperar la sesión del usuario desde localStorage
   */
  const cargarSesion = () => {
    try {
      // Obtener datos del localStorage
      const sesionGuardada = localStorage.getItem('usuarioActivo');
      
      if (sesionGuardada) {
        // Si existe, parsear el JSON y establecer el usuario
        const usuarioData = JSON.parse(sesionGuardada);
        setUser(usuarioData);
        console.log('✅ Sesión restaurada:', usuarioData.nombre);
      }
    } catch (error) {
      console.error('❌ Error al cargar sesión:', error);
    } finally {
      // Siempre marcar como terminado de cargar
      setLoading(false);
    }
  };

  // ===================================
  // FUNCIÓN: LOGIN
  // ===================================
  /**
   * Autentica al usuario y guarda la sesión
   * 
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Object} { success: boolean, message: string, user: Object }
   */
// ===================================
// FUNCIÓN: LOGIN
// ===================================
const login = async (username, password) => {
  try {
    console.log('🔄 Iniciando login...');
    
    // Llamar al servicio de autenticación
    const resultado = await authService.login(username, password);

    if (resultado.success) {
      // Extraer datos del resultado
      const { user: userData, accessToken } = resultado.data;

      // Crear objeto de sesión
      const sesion = {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
        avatar: userData.avatar,
        token: accessToken,  // Guardar el token
        fechaLogin: new Date().toISOString(),
      };

      // Guardar en localStorage
      localStorage.setItem('usuarioActivo', JSON.stringify(sesion));
      
      // Actualizar estado
      setUser(sesion);
      
      console.log('✅ Login exitoso:', sesion.nombre);
      
      return {
        success: true,
        message: 'Login exitoso',
        user: sesion,
      };
    } else {
      // Login fallido
      console.log('❌ Login fallido:', resultado.message);
      
      return {
        success: false,
        message: resultado.message,
        user: null,
      };
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    
    return {
      success: false,
      message: 'Error inesperado. Por favor intenta de nuevo.',
      user: null,
    };
  }
};

  // ===================================
  // FUNCIÓN: LOGOUT
  // ===================================
  /**
   * Cierra la sesión del usuario
   */
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('usuarioActivo');
    
    // Limpiar estado
    setUser(null);
    
    console.log('✅ Sesión cerrada');
  };

  // ===================================
  // FUNCIÓN: ACTUALIZAR USUARIO
  // ===================================
  /**
   * Actualiza los datos del usuario (útil para editar perfil)
   * 
   * @param {Object} datosActualizados - Nuevos datos del usuario
   */
  const actualizarUsuario = (datosActualizados) => {
    // Combinar datos actuales con los nuevos
    const usuarioActualizado = { ...user, ...datosActualizados };
    
    // Guardar en localStorage
    localStorage.setItem('usuarioActivo', JSON.stringify(usuarioActualizado));
    
    // Actualizar estado
    setUser(usuarioActualizado);
    
    console.log('✅ Usuario actualizado:', usuarioActualizado);
  };

  // ===================================
  // VALOR DEL CONTEXTO
  // ===================================
  /**
   * value: Objeto que se compartirá con todos los componentes
   * Contiene:
   * - user: Datos del usuario actual
   * - login: Función para iniciar sesión
   * - logout: Función para cerrar sesión
   * - actualizarUsuario: Función para actualizar datos del usuario
   * - loading: Estado de carga inicial
   */
  const value = {
    user,
    login,
    logout,
    actualizarUsuario,
    loading
  };

  // ===================================
  // RENDERIZAR PROVIDER
  // ===================================
  /**
   * Mientras está cargando, mostrar un loader
   * Cuando termine, mostrar la app normalmente
   */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin"></i> Cargando...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===================================
// HOOK PERSONALIZADO
// ===================================
/**
 * useAuth: Hook personalizado para acceder al contexto de autenticación
 * 
 * Uso en componentes:
 * const { user, login, logout } = useAuth();
 * 
 * @returns {Object} Contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Verificar que se esté usando dentro de un AuthProvider
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

// ===================================
// EXPLICACIÓN DE CONCEPTOS
// ===================================

/**
 * ¿Qué es Context API?
 * - Sistema de React para compartir datos globalmente
 * - Evita "prop drilling" (pasar props por muchos niveles)
 * - Perfecto para: autenticación, tema, idioma, etc.
 * 
 * ¿Cómo funciona?
 * 1. Crear el contexto: createContext()
 * 2. Crear el Provider: Componente que provee los datos
 * 3. Consumir el contexto: useContext() o hook personalizado
 * 
 * En esta app:
 * - AuthContext almacena: usuario actual, funciones de login/logout
 * - AuthProvider envuelve toda la app
 * - useAuth() permite acceder al contexto desde cualquier componente
 */

/**
 * ¿Qué es localStorage?
 * - Almacenamiento del navegador que persiste datos
 * - Los datos NO se borran al cerrar el navegador
 * - Solo almacena strings (por eso usamos JSON.stringify/parse)
 * - Límite: ~5-10MB dependiendo del navegador
 * 
 * Métodos:
 * - localStorage.setItem('key', 'value') - Guardar
 * - localStorage.getItem('key') - Leer
 * - localStorage.removeItem('key') - Eliminar
 * - localStorage.clear() - Borrar todo
 */

/**
 * ¿Qué es useState?
 * - Hook de React para manejar estado
 * - Estado: datos que pueden cambiar y re-renderizar el componente
 * 
 * const [valor, setValor] = useState(valorInicial);
 * - valor: el dato actual
 * - setValor: función para cambiar el dato
 * - valorInicial: valor por defecto
 */

/**
 * ¿Qué es useEffect?
 * - Hook para efectos secundarios
 * - Se ejecuta después de que el componente se renderiza
 * 
 * useEffect(() => {
 *   // código que se ejecuta
 * }, [dependencias]);
 * 
 * - [] vacío: se ejecuta solo una vez al montar
 * - [variable]: se ejecuta cuando variable cambia
 */
