const { getConfig, verifyToken } = require('../utils/auth');

const requireAuth = (req, res, next) => {
  const config = getConfig();

  if (!config.configured) {
    return res.status(500).json({
      error: 'La autenticación no está configurada. Define AUTH_USERNAME, AUTH_PASSWORD y AUTH_TOKEN_SECRET.',
    });
  }

  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesión requerida' });
  }

  const token = header.slice('Bearer '.length);

  try {
    req.auth = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

module.exports = { requireAuth };
