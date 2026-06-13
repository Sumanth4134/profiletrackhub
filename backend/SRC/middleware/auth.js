const pool = require('../config/db');
const { verifyToken } = require('../utils/auth');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyToken(token);
    const result = await pool.query(
      `SELECT id, name, phone, role, status, bio, photo_url, created_at
       FROM admins
       WHERE id = $1`,
      [payload.adminId]
    );

    const admin = result.rows[0];
    const sessionRole = payload?.role;

    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ error: 'Session is no longer active' });
    }

    req.user = {
      ...admin,
      role: sessionRole || admin.role
    };
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
