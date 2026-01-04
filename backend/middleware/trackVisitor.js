import { poolPromise } from '../config/db.js';

// Middleware to track page visits
export const trackVisitor = async (req, res, next) => {
    // Skip tracking for API calls and static assets
    if (req.path.startsWith('/api') ||
        req.path.includes('.') ||
        req.method !== 'GET') {
        return next();
    }

    try {
        const pool = await poolPromise;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const userId = req.user?.id || null;

        await pool.request()
            .input('path', req.path)
            .input('ipAddress', ipAddress)
            .input('userAgent', userAgent.substring(0, 500))
            .input('userId', userId)
            .query(`
        INSERT INTO page_visits (path, ip_address, user_agent, user_id)
        VALUES (@path, @ipAddress, @userAgent, @userId)
      `);
    } catch (error) {
        // Don't break the request if tracking fails
        console.error('Visitor tracking error:', error.message);
    }

    next();
};

// Track API visits (for analytics)
export const trackApiVisit = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const userId = req.user?.id || null;

        await pool.request()
            .input('path', req.path)
            .input('ipAddress', ipAddress)
            .input('userAgent', userAgent.substring(0, 500))
            .input('userId', userId)
            .query(`
        INSERT INTO page_visits (path, ip_address, user_agent, user_id)
        VALUES (@path, @ipAddress, @userAgent, @userId)
      `);
    } catch (error) {
        console.error('API tracking error:', error.message);
    }

    next();
};
