const User = require('../models/user');

const adminController = {
  // Get all users with optional filters
  async getUsers(req, res) {
    try {
      console.log('Admin getUsers - Request details:', {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        query: req.query
      });

      const { role, isApproved } = req.query;
      console.log('Admin getUsers - Fetching users with filters:', {
        role,
        isApproved
      });

      const users = await User.findAll(role, isApproved !== undefined ? isApproved === 'true' : null);
      console.log('Admin getUsers - Found users:', {
        count: users.length,
        roles: [...new Set(users.map(u => u.role))]
      });

      res.json(users);
    } catch (error) {
      console.error('Admin getUsers - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        message: 'Error fetching users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Approve a user
  async approveUser(req, res) {
    try {
      const { userId } = req.params;
      console.log('Admin approveUser - Request details:', {
        adminId: req.user.id,
        userId,
        userRole: req.user.role
      });

      const user = await User.updateApprovalStatus(userId, true);
      if (!user) {
        console.log('Admin approveUser - User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Admin approveUser - User approved:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json(user);
    } catch (error) {
      console.error('Admin approveUser - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        message: 'Error approving user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Unapprove a user
  async unapproveUser(req, res) {
    try {
      const { userId } = req.params;
      console.log('Admin unapproveUser - Request details:', {
        adminId: req.user.id,
        userId,
        userRole: req.user.role
      });

      const user = await User.updateApprovalStatus(userId, false);
      if (!user) {
        console.log('Admin unapproveUser - User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Admin unapproveUser - User unapproved:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json(user);
    } catch (error) {
      console.error('Admin unapproveUser - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        message: 'Error unapproving user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update user role
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      console.log('Admin updateUserRole - Request details:', {
        adminId: req.user.id,
        userId,
        newRole: role,
        userRole: req.user.role
      });

      if (!['volunteer', 'student', 'administrator'].includes(role)) {
        console.log('Admin updateUserRole - Invalid role:', role);
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.updateRole(userId, role);
      if (!user) {
        console.log('Admin updateUserRole - User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Admin updateUserRole - Role updated:', {
        userId: user.id,
        email: user.email,
        oldRole: user.role,
        newRole: role
      });

      res.json(user);
    } catch (error) {
      console.error('Admin updateUserRole - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        message: 'Error updating user role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = adminController; 