import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { poolPromise } from '../config/db.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const pool = await poolPromise;
    const existingUser = await pool.request()
      .input('email', email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input('name', name)
      .input('email', email)
      .input('password', hashedPassword)
      .query(`
        INSERT INTO users (name, email, password) VALUES (@name, @email, @password);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const userId = result.recordset[0].id;

    await pool.request()
      .input('userId', userId)
      .query('INSERT INTO notification_settings (user_id) VALUES (@userId)');

    const verificationToken = jwt.sign(
      { userId: userId, type: 'email_verify' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.',
      userId: userId
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM users WHERE email = @email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        plan: user.plan,
        planExpiresAt: user.plan_expires_at,
        emailVerified: !!user.email_verified,
        whatsapp: user.whatsapp,
        whatsappVerified: !!user.whatsapp_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const pool = await poolPromise;

    const serverCountResult = await pool.request()
      .input('userId', user.id)
      .query('SELECT COUNT(*) as count FROM servers WHERE user_id = @userId');

    const serverCount = serverCountResult.recordset[0].count;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        plan: user.plan,
        planExpiresAt: user.plan_expires_at,
        emailVerified: !!user.email_verified,
        whatsapp: user.whatsapp,
        whatsappVerified: !!user.whatsapp_verified
      },
      stats: {
        serverCount: serverCount,
        maxServers: user.plan === 'pro' ? 'unlimited' : 1
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    if (email && email !== req.user.email) {
      const existingUser = await pool.request()
        .input('email', email)
        .input('userId', userId)
        .query('SELECT id FROM users WHERE email = @email AND id != @userId');

      if (existingUser.recordset.length > 0) {
        return res.status(400).json({ error: 'Email sudah digunakan' });
      }
    }

    await pool.request()
      .input('name', name || req.user.name)
      .input('email', email || req.user.email)
      .input('userId', userId)
      .query(`
        UPDATE users SET 
          name = @name, 
          email = @email, 
          updated_at = GETDATE()
        WHERE id = @userId
      `);

    const updatedUserResult = await pool.request()
      .input('userId', userId)
      .query('SELECT id, name, email, plan, email_verified FROM users WHERE id = @userId');

    const updatedUser = updatedUserResult.recordset[0];

    res.json({
      message: 'Profil berhasil diperbarui',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        emailVerified: !!updatedUser.email_verified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    const userResult = await pool.request()
      .input('userId', userId)
      .query('SELECT password FROM users WHERE id = @userId');

    const user = userResult.recordset[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('password', hashedPassword)
      .input('userId', userId)
      .query('UPDATE users SET password = @password, updated_at = GETDATE() WHERE id = @userId');

    res.json({ message: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'email_verify') {
      return res.status(400).json({ error: 'Token tidak valid' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('userId', decoded.userId)
      .query('UPDATE users SET email_verified = 1, updated_at = GETDATE() WHERE id = @userId');

    res.json({ message: 'Email berhasil diverifikasi' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token sudah kadaluarsa' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM users WHERE id = @userId');

    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
