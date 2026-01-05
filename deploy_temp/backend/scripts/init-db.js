import { poolPromise } from '../config/db.js';

const initDb = async () => {
  try {
    const pool = await poolPromise;
    console.log('Connected to database. Initializing schema...');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        [plan] NVARCHAR(50) DEFAULT 'free',
        plan_expires_at DATETIME,
        email_verified BIT DEFAULT 0,
        whatsapp NVARCHAR(50),
        whatsapp_verified BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='servers' AND xtype='U')
      CREATE TABLE servers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        domain NVARCHAR(255) NOT NULL,
        interval INT DEFAULT 5,
        email_notif BIT DEFAULT 1,
        whatsapp_notif BIT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'unknown',
        last_check DATETIME,
        response_time INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='server_logs' AND xtype='U')
      CREATE TABLE server_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        server_id INT NOT NULL,
        status_code INT,
        response_time INT,
        status NVARCHAR(50),
        message NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='payments' AND xtype='U')
      CREATE TABLE payments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        order_id NVARCHAR(255) UNIQUE NOT NULL,
        transaction_id NVARCHAR(255),
        amount INT NOT NULL,
        [plan] NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) DEFAULT 'pending',
        payment_type NVARCHAR(50),
        midtrans_response NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' AND xtype='U')
      CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        server_id INT,
        [type] NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        [read] BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (server_id) REFERENCES servers(id)
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_settings' AND xtype='U')
      CREATE TABLE notification_settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        server_down BIT DEFAULT 1,
        slow_response BIT DEFAULT 1,
        daily_summary BIT DEFAULT 0,
        slow_threshold INT DEFAULT 3000,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_servers_user' AND object_id = OBJECT_ID('servers'))
      CREATE INDEX idx_servers_user ON servers(user_id);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_server_logs_server' AND object_id = OBJECT_ID('server_logs'))
      CREATE INDEX idx_server_logs_server ON server_logs(server_id);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_payments_user' AND object_id = OBJECT_ID('payments'))
      CREATE INDEX idx_payments_user ON payments(user_id);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_notifications_user' AND object_id = OBJECT_ID('notifications'))
      CREATE INDEX idx_notifications_user ON notifications(user_id);
    `);

    console.log('Schema initialization completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Schema initialization failed:', error);
    process.exit(1);
  }
};

initDb();
