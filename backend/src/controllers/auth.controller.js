const { getConfig, signToken, validateCredentials } = require('../utils/auth');

const login = async (req, res) => {
  try {
    const { username = '', password = '' } = req.body || {};
    const config = getConfig();

    if (!config.configured) {
      return res.status(500).json({
        error: 'La autenticación no está configurada. Define AUTH_USERNAME, AUTH_PASSWORD y AUTH_TOKEN_SECRET.',
      });
    }

    if (!username.trim() || !password.trim()) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    if (!validateCredentials(username.trim(), password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken(username.trim());

    return res.json({
      token,
      session: {
        username: username.trim(),
        role: 'admin',
      },
      meta: {
        usingFallbackCredentials: config.usingFallback,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
};

const me = async (req, res) => {
  return res.json({
    session: {
      username: req.auth.sub,
      role: 'admin',
    },
  });
};

module.exports = { login, me };
