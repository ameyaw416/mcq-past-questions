// backend/middlewares/verifyAuth.js
import jwt from 'jsonwebtoken';

const attachUserFromToken = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'No token provided' });
      return false;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Malformed token' });
      return false;
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.userId, email: payload.email, role: payload.role || 'user' };
    return true;
  } catch (err) {
    console.error('verifyAuth - jwt verify error:', err && err.message ? err.message : err);
    if (err && err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else if (err && err.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
    return false;
  }
};

export default function verifyAuth(req, res, next) {
  if (!attachUserFromToken(req, res)) return;
  next();
}

