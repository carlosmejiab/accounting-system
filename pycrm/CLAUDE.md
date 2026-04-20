# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Start dev server (http://localhost:3000)
npm run build    # Production build
npm test         # Run tests (Jest + React Testing Library)
npm test -- --testPathPattern=<file>  # Run a single test file
```

To run the mock auth server (for dev without the .NET backend):
```bash
node api/mock-auth-server.js   # Starts on port 3001
```

## Architecture

This is a React 19 SPA — a CRM frontend that talks to a .NET backend at `https://localhost:7002/api`.

**Routing** (`src/App.js`): Two routes — `/login` (public) and `/dashboard` (protected via `ProtectedRoute`). Everything else redirects to `/login`.

**Auth flow** (`src/context/AuthContext.js`): `AuthProvider` wraps the whole app. On load it reads `localStorage.usuarioActivo` and validates the stored JWT with the backend. Exposes `useAuth()` hook providing `user`, `loading`, `login()`, `logout()`, and `actualizarUsuario()`.

**API layer** (`src/config/api.js`): Defines `API_BASE_URL` (`https://localhost:7002/api`) and a `getHeaders()` helper that injects the Bearer token from `localStorage.usuarioActivo`. All services import from here.

**Services** (`src/services/`): One file per domain — `authService`, `clientService`, `userService`, `profilesService`, `catalogService`, `contactService`, `clientAccountService`. They use the native `fetch` API (not Axios) with `getHeaders()`.

**Dashboard layout** (`src/components/Dashboard.js`): Hosts `Sidebar` and `Navbar` plus renders the active section (`Clients`, `Users`, `Profiles`) based on internal state — no sub-routing, just conditional rendering.

**Styling**: Each major component has a matching CSS file in `src/styles/` (e.g., `Clients.css` for `Clients.js`). Global styles live in `src/index.css`. Bootstrap 5 + React-Bootstrap are the primary UI layer; Font Awesome provides icons.

**Session persistence**: The logged-in user object (id, username, nombre, email, rol, avatar, token, fechaLogin) is stored as JSON under `localStorage.usuarioActivo`.
