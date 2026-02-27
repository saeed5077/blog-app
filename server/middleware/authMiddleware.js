const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect — must be logged in ─────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // password has select:false so it won't be included automatically
    req.user = await User.findById(decoded.id);

    if (!req.user) {
       return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// ── Authorize — role based access control (RBAC) ────────────────
// Usage: authorize('admin') or authorize('admin', 'editor')
// This is a function that RETURNS middleware — called a middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };