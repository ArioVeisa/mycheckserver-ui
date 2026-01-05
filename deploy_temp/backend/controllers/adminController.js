import { poolPromise } from '../config/db.js';

// Get all users with subscription status
export const getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
        SELECT 
          id, name, email, role, plan, plan_expires_at, 
          email_verified, google_id, avatar, created_at
        FROM users 
        ORDER BY created_at DESC
      `);

        const users = result.recordset.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            plan: user.plan || 'free',
            planExpiresAt: user.plan_expires_at,
            emailVerified: !!user.email_verified,
            hasGoogleAuth: !!user.google_id,
            avatar: user.avatar,
            createdAt: user.created_at,
            isSubscribed: user.plan === 'pro' && (!user.plan_expires_at || new Date(user.plan_expires_at) > new Date())
        }));

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
};

// Get admin dashboard stats
export const getStats = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Total users
        const totalUsersResult = await pool.request()
            .query('SELECT COUNT(*) as count FROM users');
        console.log('DEBUG: totalUsers raw result:', JSON.stringify(totalUsersResult));
        const totalUsers = Number(totalUsersResult.recordset[0].count);

        // Pro subscribers
        const proUsersResult = await pool.request()
            .query("SELECT COUNT(*) as count FROM users WHERE plan = 'pro'");
        const proUsers = Number(proUsersResult.recordset[0].count);

        // Free users
        const freeUsers = totalUsers - proUsers;

        // Total servers
        const totalServersResult = await pool.request()
            .query('SELECT COUNT(*) as count FROM servers');
        const totalServers = Number(totalServersResult.recordset[0].count);

        // Today's visitors
        const todayVisitorsResult = await pool.request()
            .query("SELECT COUNT(*) as count FROM page_visits WHERE DATE(created_at) = CURDATE()");
        const todayVisitors = Number(todayVisitorsResult.recordset[0].count);

        // Total revenue (from successful payments)
        const revenueResult = await pool.request()
            .query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status IN ('settlement', 'capture', 'success', 'paid')");
        const totalRevenue = Number(revenueResult.recordset[0].total);

        res.json({
            totalUsers,
            proUsers,
            freeUsers,
            totalServers,
            todayVisitors,
            totalRevenue
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
};

// Get visitor analytics for chart
export const getVisitorAnalytics = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { days = 7 } = req.query;

        const result = await pool.request()
            .input('days', parseInt(days))
            .query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as visits
        FROM page_visits 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL @days DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `);

        const analytics = result.recordset.map(row => ({
            date: row.date,
            visits: Number(row.visits)
        }));

        res.json({ analytics });
    } catch (error) {
        console.error('Get visitor analytics error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Role tidak valid' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('role', role)
            .input('userId', userId)
            .query('UPDATE users SET role = @role, updated_at = GETDATE() WHERE id = @userId');

        res.json({ message: 'Role berhasil diupdate' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
};
