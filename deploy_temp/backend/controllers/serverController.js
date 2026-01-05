import { poolPromise } from '../config/db.js';
import { checkServer } from '../services/monitorService.js';

export const getServers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', req.user.id)
      .query(`
        SELECT id, name, domain, interval, email_notif, whatsapp_notif, status, response_time, last_check, created_at
        FROM servers WHERE user_id = @userId ORDER BY created_at DESC
      `);

    res.json({ servers: result.recordset });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getServer = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const serverResult = await pool.request()
      .input('id', id)
      .input('userId', req.user.id)
      .query('SELECT * FROM servers WHERE id = @id AND user_id = @userId');

    const server = serverResult.recordset[0];

    if (!server) {
      return res.status(404).json({ error: 'Server tidak ditemukan' });
    }

    const logsResult = await pool.request()
      .input('serverId', id)
      .query(`
        SELECT TOP 50 * FROM server_logs WHERE server_id = @serverId 
        ORDER BY created_at DESC
      `);

    const uptimeDataResult = await pool.request()
      .input('serverId', id)
      .query(`
        SELECT 
          FORMAT(created_at, 'HH:00') as hour,
          AVG(CASE WHEN status = 'up' THEN 100.0 ELSE 0.0 END) as uptime,
          AVG(response_time) as avg_response_time
        FROM server_logs 
        WHERE server_id = @serverId AND created_at >= DATEADD(hour, -24, GETDATE())
        GROUP BY FORMAT(created_at, 'HH:00')
        ORDER BY hour
      `);

    res.json({
      server: {
        id: server.id,
        name: server.name,
        domain: server.domain,
        interval: server.interval,
        emailNotif: !!server.email_notif,
        whatsappNotif: !!server.whatsapp_notif,
        status: server.status,
        responseTime: server.response_time,
        lastCheck: server.last_check,
        createdAt: server.created_at
      },
      logs: logsResult.recordset.map(log => ({
        id: log.id,
        statusCode: log.status_code,
        responseTime: log.response_time,
        status: log.status,
        message: log.message,
        createdAt: log.created_at
      })),
      uptimeData: uptimeDataResult.recordset
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const createServer = async (req, res) => {
  try {
    const { name, domain, interval = 5, emailNotif = true, whatsappNotif = false } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Nama dan domain wajib diisi' });
    }

    if (req.user.plan === 'free') {
      const serverCountResult = await pool.request()
        .input('userId', userId)
        .query('SELECT COUNT(*) as count FROM servers WHERE user_id = @userId');

      if (serverCountResult.recordset[0].count >= 1) {
        return res.status(403).json({ error: 'Paket Free hanya bisa menambah 1 server. Upgrade ke Pro untuk unlimited!' });
      }

      if (interval < 5) {
        return res.status(403).json({ error: 'Interval minimum untuk paket Free adalah 5 menit' });
      }
    }

    const result = await pool.request()
      .input('userId', userId)
      .input('name', name)
      .input('domain', domain)
      .input('interval', interval)
      .input('emailNotif', emailNotif ? 1 : 0)
      .input('whatsappNotif', whatsappNotif ? 1 : 0)
      .query(`
        INSERT INTO servers (user_id, name, domain, interval, email_notif, whatsapp_notif)
        VALUES (@userId, @name, @domain, @interval, @emailNotif, @whatsappNotif);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const serverId = result.recordset[0].id;

    const serverResult = await pool.request()
      .input('id', serverId)
      .query('SELECT * FROM servers WHERE id = @id');

    const server = serverResult.recordset[0];

    checkServer(server).catch(err => console.error('Initial check error:', err));

    res.status(201).json({
      message: 'Server berhasil ditambahkan',
      server: {
        id: server.id,
        name: server.name,
        domain: server.domain,
        interval: server.interval,
        emailNotif: !!server.email_notif,
        whatsappNotif: !!server.whatsapp_notif,
        status: server.status,
        responseTime: server.response_time
      }
    });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const updateServer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, interval, emailNotif, whatsappNotif } = req.body;
    const userId = req.user.id;
    const pool = await poolPromise;

    const serverResult = await pool.request()
      .input('id', id)
      .input('userId', userId)
      .query('SELECT * FROM servers WHERE id = @id AND user_id = @userId');

    const server = serverResult.recordset[0];
    if (!server) {
      return res.status(404).json({ error: 'Server tidak ditemukan' });
    }

    if (req.user.plan === 'free' && interval && interval < 5) {
      return res.status(403).json({ error: 'Interval minimum untuk paket Free adalah 5 menit' });
    }

    await pool.request()
      .input('name', name || server.name)
      .input('domain', domain || server.domain)
      .input('interval', interval || server.interval)
      .input('emailNotif', emailNotif !== undefined ? (emailNotif ? 1 : 0) : server.email_notif)
      .input('whatsappNotif', whatsappNotif !== undefined ? (whatsappNotif ? 1 : 0) : server.whatsapp_notif)
      .input('id', id)
      .query(`
        UPDATE servers SET 
          name = @name,
          domain = @domain,
          interval = @interval,
          email_notif = @emailNotif,
          whatsapp_notif = @whatsappNotif,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    const updatedServerResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM servers WHERE id = @id');

    const updatedServer = updatedServerResult.recordset[0];

    res.json({
      message: 'Server berhasil diperbarui',
      server: {
        id: updatedServer.id,
        name: updatedServer.name,
        domain: updatedServer.domain,
        interval: updatedServer.interval,
        emailNotif: !!updatedServer.email_notif,
        whatsappNotif: !!updatedServer.whatsapp_notif,
        status: updatedServer.status,
        responseTime: updatedServer.response_time
      }
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const deleteServer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await poolPromise;

    // Check if server exists and belongs to user
    const checkResult = await pool.request()
      .input('id', id)
      .input('userId', userId)
      .query('SELECT id FROM servers WHERE id = @id AND user_id = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Server tidak ditemukan' });
    }

    // Manually set server_id to NULL in notifications to avoid FK constraint error
    await pool.request()
      .input('serverId', id)
      .query('UPDATE notifications SET server_id = NULL WHERE server_id = @serverId');

    // Delete the server
    await pool.request()
      .input('id', id)
      .query('DELETE FROM servers WHERE id = @id');

    res.json({ message: 'Server berhasil dihapus' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const checkServerNow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = await poolPromise;

    const serverResult = await pool.request()
      .input('id', id)
      .input('userId', userId)
      .query('SELECT * FROM servers WHERE id = @id AND user_id = @userId');

    const server = serverResult.recordset[0];
    if (!server) {
      return res.status(404).json({ error: 'Server tidak ditemukan' });
    }

    const result = await checkServer(server);

    res.json({
      message: 'Check selesai',
      result
    });
  } catch (error) {
    console.error('Check server error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
