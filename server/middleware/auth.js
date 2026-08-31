const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Log in as admin to do that.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your admin session expired. Log in again.' });
  }
}

module.exports = requireAdmin;
