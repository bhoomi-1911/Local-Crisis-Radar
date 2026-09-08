const express = require('express');

const router = express.Router();

const {
  listUsers,
  createUser,
  updateUserRole,
  setUserActive,
} = require('../controllers/userController');

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Every route below requires an authenticated admin.
router.use(requireAuth, requireRole('admin'));

// Get all users
router.get('/', listUsers);

// Create a new citizen / authority / admin
router.post('/', createUser);

// Change a user's role
router.patch('/:id/role', updateUserRole);

// Suspend or reactivate a user
router.patch('/:id/suspend', setUserActive);

module.exports = router;