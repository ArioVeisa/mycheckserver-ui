import { poolPromise } from '../config/db.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT TOP (@limit) n.*, s.name as server_name 
      FROM notifications n
      LEFT JOIN servers s ON n.server_id = s.id
      WHERE n.user_id = @userId
    `;

    if (unreadOnly === 'true') {
      query += ' AND n.read = 0';
    }

    query += ' ORDER BY n.created_at DESC';

    const result = await pool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit))
      .query(query);

    const unreadCountResult = await pool.request()
      .input('userId', userId)
      .query('SELECT COUNT(*) as count FROM notifications WHERE user_id = @userId AND [read] = 0');

    res.json({
      notifications: result.recordset.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        serverName: n.server_name,
        read: !!n.read,
        createdAt: n.created_at
      })),
      unreadCount: unreadCountResult.recordset[0].count
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await poolPromise;

    const notificationResult = await pool.request()
      .input('id', id)
      .input('userId', userId)
      .query('SELECT id FROM notifications WHERE id = @id AND user_id = @userId');

    if (notificationResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    await pool.request()
      .input('id', id)
      .query('UPDATE notifications SET [read] = 1 WHERE id = @id');

    res.json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    await pool.request()
      .input('userId', userId)
      .query('UPDATE notifications SET [read] = 1 WHERE user_id = @userId');

    res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    let settingsResult = await pool.request()
      .input('userId', userId)
      .query('SELECT * FROM notification_settings WHERE user_id = @userId');

    let settings = settingsResult.recordset[0];

    if (!settings) {
      await pool.request()
        .input('userId', userId)
        .query('INSERT INTO notification_settings (user_id) VALUES (@userId)');

      settingsResult = await pool.request()
        .input('userId', userId)
        .query('SELECT * FROM notification_settings WHERE user_id = @userId');

      settings = settingsResult.recordset[0];
    }

    res.json({
      serverDown: !!settings.server_down,
      slowResponse: !!settings.slow_response,
      dailySummary: !!settings.daily_summary,
      slowThreshold: settings.slow_threshold
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverDown, slowResponse, dailySummary, slowThreshold } = req.body;
    const pool = await poolPromise;

    // Get current settings first to handle COALESCE logic in JS or use SQL COALESCE with parameters
    // Using SQL COALESCE with parameters is cleaner but requires passing current values or NULL if undefined
    // But here we can just pass the values directly if we construct the query carefully or just use the same logic as before

    // However, T-SQL COALESCE works same way.
    // We need to fetch current settings to know what to pass if undefined? No, we can pass NULL and let COALESCE handle it if we want to keep existing.
    // But wait, if we pass NULL to COALESCE(param, column), it updates to column value (no change).
    // So we need to pass NULL if the value is undefined in the request.

    await pool.request()
      .input('serverDown', serverDown !== undefined ? (serverDown ? 1 : 0) : null)
      .input('slowResponse', slowResponse !== undefined ? (slowResponse ? 1 : 0) : null)
      .input('dailySummary', dailySummary !== undefined ? (dailySummary ? 1 : 0) : null)
      .input('slowThreshold', slowThreshold || null)
      .input('userId', userId)
      .query(`
        UPDATE notification_settings SET
          server_down = COALESCE(@serverDown, server_down),
          slow_response = COALESCE(@slowResponse, slow_response),
          daily_summary = COALESCE(@dailySummary, daily_summary),
          slow_threshold = COALESCE(@slowThreshold, slow_threshold),
          updated_at = GETDATE()
        WHERE user_id = @userId
      `);

    res.json({ message: 'Pengaturan notifikasi berhasil diperbarui' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const updateWhatsapp = async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    if (req.user.plan !== 'pro') {
      return res.status(403).json({ error: 'Fitur WhatsApp hanya untuk pengguna Pro' });
    }

    await pool.request()
      .input('whatsapp', whatsapp)
      .input('userId', userId)
      .query(`
        UPDATE users SET whatsapp = @whatsapp, whatsapp_verified = 0, updated_at = GETDATE()
        WHERE id = @userId
      `);

    res.json({ message: 'Nomor WhatsApp berhasil disimpan' });
  } catch (error) {
    console.error('Update whatsapp error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
