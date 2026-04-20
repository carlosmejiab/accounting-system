// Mock auth server (minimal, no external deps)
const http = require('node:http');

const PORT = process.env.MOCK_AUTH_PORT || 3001;

// Evitar credenciales hard-coded: leer desde variables de entorno
const USERS = [
  {
    username: process.env.MOCK_USER_ADMIN || 'admin',
    password: process.env.MOCK_PASS_ADMIN || 'change_me', // dejar valor por defecto no sensible
    role: 'admin'
  },
  {
    username: process.env.MOCK_USER_USER || 'user',
    password: process.env.MOCK_PASS_USER || 'change_me',
    role: 'user'
  }
];

function sendJSON(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        const obj = data ? JSON.parse(data) : {};
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  // Simple CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    try {
      const body = await parseBody(req);
      const { username, password } = body || {};

      if (!username || !password) {
        return sendJSON(res, 400, { success: false, message: 'username and password required' });
      }

      const usuario = USERS.find(u => u.username === username && u.password === password);

      if (!usuario) {
        return sendJSON(res, 401, { success: false, message: 'Credenciales inválidas' });
      }

      const sesion = {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        avatar: usuario.avatar,
        fechaLogin: new Date().toISOString()
      };

      // Note: token is a fake token for mock purposes
      const token = 'fake-jwt-token.' + usuario.id;

      return sendJSON(res, 200, { success: true, user: sesion, token });

    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Error parsing request' });
    }
  }

  // Fallback 404
  sendJSON(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => console.log(`Mock auth server listening on ${PORT}`));
