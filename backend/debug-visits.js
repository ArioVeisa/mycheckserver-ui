
import { poolPromise } from './config/db.js';

(async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT count(*) as count FROM page_visits');
        console.log('Page Visits Count:', result.recordset[0].count);

        const recent = await pool.request().query('SELECT * FROM page_visits ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Visits:', recent.recordset);
    } catch (err) {
        console.error('Error:', err);
    }
})();
