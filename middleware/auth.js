const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request headers:', {
      authorization: req.header('Authorization'),
      path: req.path,
      method: req.method
    });

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Auth middleware - Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', {
      id: decoded.id,
      role: decoded.role,
      exp: decoded.exp
    });

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth middleware - User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware - Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ 
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = auth; 