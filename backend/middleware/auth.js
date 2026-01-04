import jwt from 'jsonwebtoken';
import { poolPromise } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', decoded.userId)
      .query('SELECT id, name, email, role, plan, plan_expires_at, email_verified, whatsapp, whatsapp_verified, google_id, avatar FROM users WHERE id = @userId');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    if (user.plan === 'pro' && user.plan_expires_at) {
      const expiresAt = new Date(user.plan_expires_at);
      if (expiresAt < new Date()) {
        await pool.request()
          .input('plan', 'free')
          .input('userId', user.id)
          .query('UPDATE users SET plan = @plan WHERE id = @userId');
        user.plan = 'free';
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

export const requirePro = (req, res, next) => {
  if (req.user.plan !== 'pro') {
    return res.status(403).json({ error: 'Fitur ini hanya untuk pengguna Pro' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  console.log('DEBUG: requireAdmin check. User role:', req.user?.role);
  if (req.user.role !== 'admin') {
    console.log('DEBUG: Access denied. Not admin.');
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next();
};
