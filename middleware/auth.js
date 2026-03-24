const jwt = require('jsonwebtoken');
const path = require('path');

const sendAuthError = (req, res, message, status = 401) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ error: message });
  }

  if (status === 403) {
    return res.status(403).sendFile(path.join(__dirname, '..', 'public', '403.html'));
  }

  return res.status(401).sendFile(path.join(__dirname, '..', 'public', '401.html'));
};

const authenticateToken = (req, res, next) => {
  const token =
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return sendAuthError(req, res, 'Access denied. No token provided.', 401);
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).sendFile(path.join(__dirname, '..', 'public', '500.html'));
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return sendAuthError(req, res, 'Invalid or expired token', 401);
  }
};

module.exports = { authenticateToken };
