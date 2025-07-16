const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Authenticate user
    const authResult = await jwtAuth.authenticateUser(username, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: authResult
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = jwtAuth.verifyToken(token);
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', jwtAuth.authenticateToken.bind(jwtAuth), (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: req.user
  });
});

// GET /api/auth/demo-accounts - Get demo accounts for auto-fill
router.get('/demo-accounts', (req, res) => {
  const demoAccounts = jwtAuth.getDemoAccounts().map(account => ({
    username: account.username,
    role: account.role,
    fullName: account.fullName
  }));

  res.json({
    success: true,
    message: 'Demo accounts retrieved successfully',
    data: demoAccounts
  });
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', jwtAuth.authenticateToken.bind(jwtAuth), (req, res) => {
  // In a real implementation, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router; 