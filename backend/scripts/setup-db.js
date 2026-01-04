import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const setupDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'secure',
    multipleStatements: true
  });

  try {
    console.log('🔄 Dropping existing tables...');

    // Drop all tables in correct order (respect foreign keys)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS page_visits');
    await connection.query('DROP TABLE IF EXISTS payments');
    await connection.query('DROP TABLE IF EXISTS notification_settings');
    await connection.query('DROP TABLE IF EXISTS notifications');
    await connection.query('DROP TABLE IF EXISTS server_logs');
    await connection.query('DROP TABLE IF EXISTS servers');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Tables dropped');
    console.log('🔄 Creating tables...');

    // Create users table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT '',
        role VARCHAR(50) DEFAULT 'user',
        plan VARCHAR(50) DEFAULT 'free',
        plan_expires_at DATETIME,
        email_verified TINYINT DEFAULT 0,
        whatsapp VARCHAR(50),
        whatsapp_verified TINYINT DEFAULT 0,
        google_id VARCHAR(255),
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ users table created');

    // Create servers table
    await connection.query(`
      CREATE TABLE servers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        \`interval\` INT DEFAULT 5,
        email_notif TINYINT DEFAULT 1,
        whatsapp_notif TINYINT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'unknown',
        response_time INT,
        last_check DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ servers table created');

    // Create server_logs table
    await connection.query(`
      CREATE TABLE server_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_id INT NOT NULL,
        status_code INT,
        response_time INT,
        status VARCHAR(50),
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ server_logs table created');

    // Create notifications table
    await connection.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        server_id INT,
        type VARCHAR(50),
        title VARCHAR(255),
        message TEXT,
        \`read\` TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ notifications table created');

    // Create notification_settings table - with ALL required columns
    await connection.query(`
      CREATE TABLE notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        email_enabled TINYINT DEFAULT 1,
        whatsapp_enabled TINYINT DEFAULT 0,
        notify_down TINYINT DEFAULT 1,
        notify_up TINYINT DEFAULT 1,
        server_down TINYINT DEFAULT 1,
        slow_response TINYINT DEFAULT 0,
        slow_threshold INT DEFAULT 5000,
        daily_summary TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ notification_settings table created');

    // Create payments table
    await connection.query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        plan VARCHAR(50) DEFAULT 'pro',
        status VARCHAR(50) DEFAULT 'pending',
        payment_type VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ payments table created');

    // Create page_visits table
    await connection.query(`
      CREATE TABLE page_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        path VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        user_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ page_visits table created');

    console.log('✅ All tables created');
    console.log('🔄 Seeding admin user...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password, role, email_verified) 
       VALUES (?, ?, ?, ?, 1)`,
      ['Administrator', 'admin@mycheckserver.com', hashedPassword, 'admin']
    );

    const userId = result.insertId;

    // Create notification settings for admin
    await connection.execute(
      'INSERT INTO notification_settings (user_id) VALUES (?)',
      [userId]
    );

    console.log('✅ Admin user created');
    console.log('');
    console.log('======================================');
    console.log('  DATABASE SETUP COMPLETE!');
    console.log('======================================');
    console.log('');
    console.log('Admin Credentials:');
    console.log('  Email: admin@mycheckserver.com');
    console.log('  Password: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
};

setupDatabase();
