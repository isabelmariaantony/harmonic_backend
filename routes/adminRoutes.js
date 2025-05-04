const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check if user is administrator
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ message: 'Access denied. Administrator only.' });
  }
  next();
};

// Apply authentication and admin check to all routes
router.use(auth, isAdmin);

// Get all users with optional filters
router.get('/users', adminController.getUsers);

// Approve a user
router.post('/users/:userId/approve', adminController.approveUser);

// Unapprove a user
router.post('/users/:userId/unapprove', adminController.unapproveUser);

// Update user role
router.put('/users/:userId/role', adminController.updateUserRole);

module.exports = router; 