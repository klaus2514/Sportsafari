const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  // 1. Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Handle ANY possible user ID field name
    const userId = decoded.userId || decoded.id || decoded._id || decoded.userID;
    
    if (!userId) {
      throw new Error('Token missing user identifier');
    }

    // 4. Attach to request
    req.user = {
      id: userId,
      role: decoded.role || 'user'
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = authMiddleware;