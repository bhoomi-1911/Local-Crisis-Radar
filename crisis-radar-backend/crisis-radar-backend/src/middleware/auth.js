const { verifyToken } = require('../utils/jwt');

// Requires a valid Bearer token. Attaches decoded payload to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Attaches req.user if a valid token is present, but doesn't reject the request otherwise.
// Useful for endpoints like GET /reports that are public but personalize when logged in.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (err) {
      // ignore invalid token on optional routes
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
