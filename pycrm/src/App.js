// ===================================
// INSTALACIÓN NECESARIA
// ===================================
// Antes de usar este archivo, ejecuta en la terminal:
// npm install react-router-dom

// ===================================
// IMPORTACIONES
// ===================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

// ===================================
// COMPONENTE DE RUTA PROTEGIDA
// ===================================
/**
 * ProtectedRoute: Componente que protege rutas que requieren autenticación
 * Si el usuario no está autenticado, lo redirige al login
 * 
 * @param {Object} children - Componentes hijos que se renderizarán si está autenticado
 */
function ProtectedRoute({ children }) {
  // useAuth() obtiene el contexto de autenticación
  const { user } = useAuth();
  
  // Si no hay usuario logueado, redirige al login
  // Si hay usuario, muestra el componente (children)
  return user ? children : <Navigate to="/login" />;
}

// ===================================
// COMPONENTE PRINCIPAL DE LA APP
// ===================================
/**
 * App: Componente raíz que configura todas las rutas de la aplicación
 * Envuelve toda la app en AuthProvider para manejar la autenticación global
 */
function App() {
  return (
    // AuthProvider: Provee el contexto de autenticación a toda la app
    <AuthProvider>
      {/* Router: Habilita el sistema de navegación de React Router */}
      <Router>
        {/* Routes: Contenedor de todas las rutas */}
        <Routes>
          
          {/* Ruta pública: Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Ruta protegida: Dashboard */}
          {/* Solo accesible si el usuario está autenticado */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta raíz: Redirige automáticamente al login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Ruta 404: Cualquier ruta no encontrada redirige al login */}
          <Route path="*" element={<Navigate to="/login" />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

// ===================================
// EXPLICACIÓN DE CONCEPTOS
// ===================================

/**
 * ¿Qué es React Router?
 * - Librería para manejar navegación en React
 * - Permite crear aplicaciones de una sola página (SPA)
 * - Cambia el contenido sin recargar la página
 * 
 * Componentes principales:
 * - BrowserRouter: Envuelve la app y habilita el routing
 * - Routes: Contenedor de todas las rutas
 * - Route: Define una ruta individual
 * - Navigate: Redirige a otra ruta
 * 
 * Ejemplo de navegación:
 * - Usuario va a: http://localhost:3000/login → Muestra Login
 * - Usuario va a: http://localhost:3000/dashboard → Muestra Dashboard (si está logueado)
 * - Usuario va a: http://localhost:3000/ → Redirige a /login
 */

/**
 * ¿Qué es un Protected Route?
 * - Ruta que requiere autenticación
 * - Si el usuario no está logueado, lo redirige al login
 * - Protege páginas privadas como dashboard, perfil, configuración, etc.
 * 
 * Flujo:
 * 1. Usuario intenta acceder a /dashboard
 * 2. ProtectedRoute verifica si hay usuario logueado
 * 3. Si hay usuario → Muestra el Dashboard
 * 4. Si NO hay usuario → Redirige a /login
 */
