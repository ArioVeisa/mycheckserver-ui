import { poolPromise } from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const totalServersResult = await pool.request()
      .input('userId', userId)
      .query('SELECT COUNT(*) as count FROM servers WHERE user_id = @userId');

    const upServersResult = await pool.request()
      .input('userId', userId)
      .query("SELECT COUNT(*) as count FROM servers WHERE user_id = @userId AND status = 'up'");

    const downServersResult = await pool.request()
      .input('userId', userId)
      .query("SELECT COUNT(*) as count FROM servers WHERE user_id = @userId AND status = 'down'");

    const uptimeDataResult = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT 
          FORMAT(sl.created_at, 'HH:00') as time,
          ROUND(AVG(CASE WHEN sl.status = 'up' THEN 100.0 ELSE 0.0 END), 1) as uptime
        FROM server_logs sl
        JOIN servers s ON sl.server_id = s.id
        WHERE s.user_id = @userId AND sl.created_at >= DATEADD(hour, -24, GETDATE())
        GROUP BY FORMAT(sl.created_at, 'HH:00')
        ORDER BY MIN(sl.created_at)
      `);

    const recentNotificationsResult = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT TOP 5 n.*, s.name as server_name
        FROM notifications n
        LEFT JOIN servers s ON n.server_id = s.id
        WHERE n.user_id = @userId
        ORDER BY n.created_at DESC
      `);

    const uptimeData = uptimeDataResult.recordset;

    res.json({
      stats: {
        totalServers: totalServersResult.recordset[0].count,
        upServers: upServersResult.recordset[0].count,
        downServers: downServersResult.recordset[0].count,
        plan: req.user.plan
      },
      uptimeData: uptimeData.length > 0 ? uptimeData : [
        { time: '00:00', uptime: 100 },
        { time: '04:00', uptime: 100 },
        { time: '08:00', uptime: 100 },
        { time: '12:00', uptime: 100 },
        { time: '16:00', uptime: 100 },
        { time: '20:00', uptime: 100 }
      ],
      recentNotifications: recentNotificationsResult.recordset.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        serverName: n.server_name,
        createdAt: n.created_at
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
