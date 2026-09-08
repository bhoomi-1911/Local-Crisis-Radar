// Usage: router.patch('/:id/status', requireAuth, requireRole('authority', 'admin'), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of these roles: ${allowedRoles.join(', ')}.` });
    }
    next();
  };
}

module.exports = { requireRole };
