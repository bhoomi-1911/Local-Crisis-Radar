const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Name, email and password are required.',
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

  // Public registration always creates a citizen account.
  // Authority and admin roles can only be assigned by an admin.
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'citizen')
     RETURNING id, name, email, role, is_active, created_at`,
    [
      name.trim(),
      normalizedEmail,
      passwordHash,
    ]
  );

  const user = result.rows[0];

  const token = signToken(user);

  res.status(201).json({
    user,
    token,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, name, email, password_hash, role, is_active
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      error: 'Invalid email or password.',
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      error: 'This account has been suspended.',
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return res.status(401).json({
      error: 'Invalid email or password.',
    });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = signToken(safeUser);

  res.json({
    user: safeUser,
    token,
  });
});

const me = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  res.json({
    user,
  });
});

module.exports = {
  register,
  login,
  me,
};