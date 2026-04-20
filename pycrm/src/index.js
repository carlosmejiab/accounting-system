// ===================================
// ARCHIVO: index.js
// ===================================
/**
 * Punto de entrada principal de la aplicación React
 * Este archivo se encarga de renderizar la app en el DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Importar Bootstrap CSS (instalado con npm install bootstrap)
import 'bootstrap/dist/css/bootstrap.min.css';

// Importar Font Awesome para los iconos
import '@fortawesome/fontawesome-free/css/all.min.css';

// Importar estilos globales (si los tienes)
import './index.css';

// ===================================
// OBTENER EL ELEMENTO ROOT DEL HTML
// ===================================
/**
 * document.getElementById('root'): Obtiene el div con id="root" del public/index.html
 * Este es el punto donde React montará toda la aplicación
 */
const rootElement = document.getElementById('root');

// ===================================
// CREAR LA RAÍZ DE REACT 18
// ===================================
/**
 * ReactDOM.createRoot(): Método de React 18 para crear una raíz
 * En versiones anteriores se usaba: ReactDOM.render()
 */
const root = ReactDOM.createRoot(rootElement);

// ===================================
// RENDERIZAR LA APLICACIÓN
// ===================================
/**
 * root.render(): Renderiza el componente App dentro del root
 * 
 * React.StrictMode:
 * - Componente que ayuda a detectar problemas en desarrollo
 * - No se renderiza en producción
 * - Ayuda a identificar:
 *   * Componentes con efectos secundarios no deseados
 *   * Uso de APIs obsoletas
 *   * Prácticas no recomendadas
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ===================================
// EXPLICACIÓN DE CONCEPTOS
// ===================================

/**
 * ¿Qué es el Virtual DOM?
 * - Representación en memoria del DOM real
 * - React compara el Virtual DOM con el DOM real
 * - Solo actualiza lo que cambió (muy eficiente)
 * 
 * Proceso:
 * 1. React crea un Virtual DOM
 * 2. Cuando hay cambios, crea un nuevo Virtual DOM
 * 3. Compara ambos (diffing)
 * 4. Actualiza solo lo necesario en el DOM real (reconciliation)
 */

/**
 * ¿Qué hace ReactDOM?
 * - Librería que conecta React con el DOM del navegador
 * - Métodos principales:
 *   * createRoot(): Crea punto de montaje (React 18+)
 *   * render(): Renderiza componentes
 *   * unmountComponentAtNode(): Desmonta componentes
 */

/**
 * ¿Por qué importar CSS en JavaScript?
 * - Webpack (bundler) procesa estos imports
 * - Combina todos los CSS en un solo archivo
 * - Permite modularidad y tree-shaking
 * 
 * Alternativas:
 * - CSS Modules: Scope local de estilos
 * - Styled Components: CSS-in-JS
 * - Tailwind CSS: Utility-first CSS
 */

/**
 * React.StrictMode - Beneficios:
 * 1. Detecta componentes con side effects inseguros
 * 2. Advierte sobre APIs obsoletas
 * 3. Detecta uso de findDOMNode (obsoleto)
 * 4. Detecta context legacy
 * 5. Renderiza dos veces en desarrollo (para detectar efectos)
 * 
 * Nota: Solo afecta el modo desarrollo, no producción
 */

/**
 * ¿Qué es npm y qué hace?
 * - Node Package Manager (gestor de paquetes)
 * - Instala, actualiza y gestiona dependencias
 * - package.json: Lista todas las dependencias
 * - node_modules/: Carpeta donde se instalan los paquetes
 * 
 * Comandos útiles:
 * - npm install: Instala todas las dependencias
 * - npm install [paquete]: Instala un paquete específico
 * - npm start: Inicia el servidor de desarrollo
 * - npm build: Crea versión de producción
 * - npm test: Ejecuta tests
 */
