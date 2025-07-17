const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class JWTAuth {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'cho-nong-san-so-secret-key-2024';
    this.jwtExpiresIn = '24h';
    this.bcryptRounds = 12;
  }

  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'cho-nong-san-so'
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Middleware for token verification
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    try {
      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
  }

  // Middleware for role-based access
  authorizeRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      next();
    };
  }

  // Demo accounts data
  getDemoAccounts() {
    return [
      {
        id: 'user_001',
        username: 'demo_user',
        password: 'user123',
        email: 'user@demo.com',
        role: 'user',
        fullName: 'Demo User',
        avatar: '/assets/images/user-avatar.png'
      },
      {
        id: 'admin_001', 
        username: 'demo_admin',
        password: 'admin123',
        email: 'admin@demo.com',
        role: 'admin',
        fullName: 'Admin User',
        avatar: '/assets/images/admin-avatar.png'
      },
      {
        id: 'logistics_001',
        username: 'demo_logistics', 
        password: 'logistics123',
        email: 'logistics@demo.com',
        role: 'logistics',
        fullName: 'Logistics Manager',
        avatar: '/assets/images/logistics-avatar.png'
      },
      {
        id: 'seller_001',
        username: 'demo_seller',
        password: 'seller123',
        email: 'seller@demo.com',
        role: 'seller',
        fullName: 'Demo Seller',
        avatar: '/assets/images/seller-avatar.png'
      }
    ];
  }

  // Authenticate user with demo accounts
  async authenticateUser(username, password) {
    const demoAccounts = this.getDemoAccounts();
    const user = demoAccounts.find(u => u.username === username);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = this.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar
      },
      token
    };
  }
}

module.exports = new JWTAuth(); 