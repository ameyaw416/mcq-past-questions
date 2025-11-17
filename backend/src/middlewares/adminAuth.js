import verifyAuth from './authMiddleware.js';

export default function adminAuth(req, res, next) {
  verifyAuth(req, res, () => {
    if ((req.user?.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}
