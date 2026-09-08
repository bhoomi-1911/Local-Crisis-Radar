const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_ROLES = ['citizen', 'authority', 'admin'];

// GET /api/users
// Admin only
const listUsers = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, is_active, created_at,
            (SELECT COUNT(*) FROM reports WHERE reporter_id = users.id) AS reports_filed
     FROM users
     ORDER BY created_at DESC`
  );

  res.json({ users: result.rows });
});

// POST /api/users
// Admin only
// Body: { name, email, password, role }
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'Name, email, password and role are required.',
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: `role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (existingUser.rows[0]) {
    return res.status(409).json({
      error: 'An account with this email already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [
      name.trim(),
      normalizedEmail,
      passwordHash,
      role,
    ]
  );

  res.status(201).json({
    user: result.rows[0],
  });
});

// PATCH /api/users/:id/role
// Admin only
// Body: { role }
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetUserId = Number(req.params.id);

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: `role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  if (targetUserId === Number(req.user.id)) {
    return res.status(400).json({
      error: 'You cannot change your own role.',
    });
  }

  const result = await pool.query(
    `UPDATE users
     SET role = $1
     WHERE id = $2
     RETURNING id, name, email, role, is_active`,
    [role, targetUserId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  res.json({
    user: result.rows[0],
  });
});

// PATCH /api/users/:id/suspend
// Admin only
// Body: { is_active }
const setUserActive = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const targetUserId = Number(req.params.id);

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'is_active must be true or false.',
    });
  }

  if (targetUserId === Number(req.user.id)) {
    return res.status(400).json({
      error: 'You cannot suspend or reactivate your own account.',
    });
  }

  const result = await pool.query(
    `UPDATE users
     SET is_active = $1
     WHERE id = $2
     RETURNING id, name, email, role, is_active`,
    [is_active, targetUserId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  res.json({
    user: result.rows[0],
  });
});

module.exports = {
  listUsers,
  createUser,
  updateUserRole,
  setUserActive,
};