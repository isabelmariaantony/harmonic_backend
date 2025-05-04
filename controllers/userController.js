const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');

const userController = {
  async register(req, res) {
    try {
      console.log('Registration attempt with data:', {
        email: req.body.email,
        name: req.body.name,
        role: req.body.role,
        hasPassword: !!req.body.password,
        hasSkills: !!req.body.skills,
        hasAvailability: !!req.body.availability
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, skills, availability } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Password hashed successfully');

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        name,
        role,
        skills,
        availability
      };
      console.log('Attempting to create user with data:', {
        ...userData,
        password: '[HASHED]'
      });

      const user = await User.create(userData);
      console.log('User created successfully:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.is_approved
      });

      res.status(201).json({
        message: 'Registration successful. Your account is pending approval by an administrator.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.is_approved
        }
      });
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        message: 'Error creating user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is approved
      if (!user.is_approved && user.role !== 'administrator') {
        return res.status(403).json({ 
          message: 'Your account is pending approval by an administrator. Please wait for approval before logging in.',
          isPendingApproval: true
        });
      }

      // Check if JWT secret is configured
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.is_approved
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  },

  async getProfile(req, res) {
    try {
      console.log('Get profile request:', {
        userId: req.user.id
      });

      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User profile data:', {
        id: user.id,
        name: user.name,
        skills: user.skills,
        availability: user.availability
      });

      // Parse skills and availability if they are strings
      const response = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_approved: user.is_approved,
        skills: typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills || [],
        availability: typeof user.availability === 'string' ? JSON.parse(user.availability) : user.availability || {}
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ 
        message: 'Error getting user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async updateProfile(req, res) {
    try {
      console.log('Update profile request:', {
        userId: req.user.id,
        body: req.body
      });

      const { name, skills, availability } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!name && !skills && !availability) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      // Prepare updates
      const updates = {};
      if (name) updates.name = name;
      if (skills) updates.skills = JSON.stringify(skills);
      if (availability) updates.availability = JSON.stringify(availability);

      // Update user profile
      const updatedUser = await User.updateProfile(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Profile updated successfully:', {
        userId: updatedUser.id,
        name: updatedUser.name,
        skills: updatedUser.skills,
        availability: updatedUser.availability
      });

      // Parse JSON fields before sending response
      const response = {
        ...updatedUser,
        skills: typeof updatedUser.skills === 'string' ? JSON.parse(updatedUser.skills) : updatedUser.skills || [],
        availability: typeof updatedUser.availability === 'string' ? JSON.parse(updatedUser.availability) : updatedUser.availability || {}
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ 
        message: 'Error updating profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = userController; 