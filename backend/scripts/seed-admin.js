import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const seedAdmin = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'secure'
    });

    try {
        // Check if admin already exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            ['admin@mycheckserver.com']
        );

        if (existing.length > 0) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const [result] = await connection.execute(
            `INSERT INTO users (name, email, password, role, email_verified) 
       VALUES (?, ?, ?, ?, 1)`,
            ['Administrator', 'admin@mycheckserver.com', hashedPassword, 'admin']
        );

        const userId = result.insertId;

        // Create notification settings
        await connection.execute(
            'INSERT INTO notification_settings (user_id) VALUES (?)',
            [userId]
        );

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@mycheckserver.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await connection.end();
        process.exit(0);
    }
};

seedAdmin();
