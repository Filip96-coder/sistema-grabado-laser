const crypto = require('crypto');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const toBase64Url = (value) => Buffer.from(value).toString('base64url');

const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const secureEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const username = process.env.AUTH_USERNAME || (!isProduction ? 'admin' : '');
  const password = process.env.AUTH_PASSWORD || (!isProduction ? 'admin1234' : '');
  const secret = process.env.AUTH_TOKEN_SECRET || (!isProduction ? 'dev-only-secret-change-me' : '');

  return {
    username,
    password,
    secret,
    configured: Boolean(username && password && secret),
    usingFallback: !process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD || !process.env.AUTH_TOKEN_SECRET,
  };
};

const signToken = (username) => {
  const config = getConfig();

  if (!config.configured) {
    throw new Error('Las credenciales de autenticación no están configuradas');
  }

  const payload = {
    sub: username,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', config.secret).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token) => {
  const config = getConfig();

  if (!config.configured) {
    throw new Error('Las credenciales de autenticación no están configuradas');
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new Error('Token inválido');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.secret)
    .update(encodedPayload)
    .digest('base64url');

  if (!secureEqual(signature, expectedSignature)) {
    throw new Error('Firma inválida');
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));

  if (!payload.exp || Date.now() > payload.exp) {
    throw new Error('Token expirado');
  }

  return payload;
};

const validateCredentials = (username, password) => {
  const config = getConfig();

  if (!config.configured) {
    return false;
  }

  return secureEqual(username, config.username) && secureEqual(password, config.password);
};

module.exports = {
  getConfig,
  signToken,
  verifyToken,
  validateCredentials,
};
