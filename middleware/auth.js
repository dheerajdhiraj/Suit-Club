const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Check for token in different headers
  let token = req.header('x-auth-token') || req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Handle "Bearer <token>" format
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.admin && req.admin.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  });
};

module.exports = { auth: authMiddleware, adminAuth };
