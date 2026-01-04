import jwt from 'jsonwebtoken';
import { poolPromise } from '../config/db.js';

// Handle Google OAuth callback
export const googleCallback = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential tidak ditemukan' });
        }

        // Decode Google JWT token (in production, verify with Google's public keys)
        const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

        const { sub: googleId, email, name, picture } = decoded;

        const pool = await poolPromise;

        // Check if user exists by google_id or email
        let result = await pool.request()
            .input('googleId', googleId)
            .input('email', email)
            .query('SELECT * FROM users WHERE google_id = @googleId OR email = @email');

        let user = result.recordset[0];

        if (user) {
            // Update google_id and avatar if not set
            if (!user.google_id) {
                await pool.request()
                    .input('googleId', googleId)
                    .input('avatar', picture)
                    .input('userId', user.id)
                    .query('UPDATE users SET google_id = @googleId, avatar = @avatar, updated_at = NOW() WHERE id = @userId');
            }
        } else {
            // Create new user - single INSERT statement
            const insertResult = await pool.request()
                .input('name', name)
                .input('email', email)
                .input('googleId', googleId)
                .input('avatar', picture)
                .query(`
                    INSERT INTO users (name, email, google_id, avatar, email_verified, password)
                    VALUES (@name, @email, @googleId, @avatar, 1, '')
                `);

            const userId = insertResult.lastInsertRowid || insertResult.recordset[0]?.id;

            // Create notification settings
            await pool.request()
                .input('userId', userId)
                .query('INSERT INTO notification_settings (user_id) VALUES (@userId)');

            // Get created user
            result = await pool.request()
                .input('userId', userId)
                .query('SELECT * FROM users WHERE id = @userId');

            user = result.recordset[0];
        }

        // Generate JWT token
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
                emailVerified: true,
                avatar: user.avatar || picture,
                whatsapp: user.whatsapp,
                whatsappVerified: !!user.whatsapp_verified
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat login dengan Google' });
    }
};
