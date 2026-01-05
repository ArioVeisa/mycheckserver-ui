import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Create pool connection with SSL for Azure MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable SSL for Azure MySQL Flexible Server
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
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

    // Create servers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS servers (
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

    // Create server_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS server_logs (
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

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
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

    // Create notification_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        email_enabled TINYINT DEFAULT 1,
        whatsapp_enabled TINYINT DEFAULT 0,
        notify_down TINYINT DEFAULT 1,
        notify_up TINYINT DEFAULT 1,
        daily_summary TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
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

    // Add plan column if it doesn't exist (for existing tables)
    try {
      await connection.query(`ALTER TABLE payments ADD COLUMN plan VARCHAR(50) DEFAULT 'pro' AFTER amount`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Create page_visits table for visitor tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        path VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        user_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables initialized');
  } finally {
    connection.release();
  }
};

// Create poolPromise wrapper for mssql-compatible API
const createRequest = () => {
  const params = {};

  return {
    input(name, value) {
      params[name] = value;
      return this;
    },
    async query(sqlQuery) {
      // Convert @paramName to ? and collect values
      const paramOrder = [];
      const processedQuery = sqlQuery.replace(/@(\w+)/g, (match, name) => {
        paramOrder.push(name);
        return '?';
      });

      const paramValues = paramOrder.map(name => params[name]);

      // Convert some SQL Server syntax to MySQL
      let query = processedQuery;

      // Convert GETDATE() to NOW()
      query = query.replace(/GETDATE\(\)/gi, 'NOW()');

      // Convert SCOPE_IDENTITY() to LAST_INSERT_ID()
      query = query.replace(/SCOPE_IDENTITY\(\)/gi, 'LAST_INSERT_ID()');

      // Convert TOP N to LIMIT N
      const topMatch = query.match(/SELECT\s+TOP\s+(\d+)\s+/i);
      if (topMatch) {
        const limit = topMatch[1];
        query = query.replace(/SELECT\s+TOP\s+\d+\s+/i, 'SELECT ');
        query = query.trimEnd() + ` LIMIT ${limit}`;
      }

      // Convert FORMAT(date, 'HH:00') to DATE_FORMAT(date, '%H:00') - handle table aliases
      query = query.replace(/FORMAT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*,\s*'HH:00'\s*\)/gi,
        (match, col) => `DATE_FORMAT(${col}, '%H:00')`);

      // Convert DATEADD(hour, N, date) to DATE_ADD(date, INTERVAL N HOUR)
      query = query.replace(/DATEADD\s*\(\s*hour\s*,\s*(-?\d+)\s*,\s*([a-zA-Z_][a-zA-Z0-9_()'.]*)\s*\)/gi,
        (match, hours, date) => `DATE_ADD(${date}, INTERVAL ${hours} HOUR)`);

      // Convert DATEADD(minute, col, col2) to DATE_ADD(col2, INTERVAL col MINUTE)
      query = query.replace(/DATEADD\s*\(\s*minute\s*,\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\)/gi,
        (match, minutes, col) => `DATE_ADD(${col}, INTERVAL ${minutes} MINUTE)`);

      // Protect INTERVAL keyword used in date functions
      // INTERVAL is always followed by expression and unit (DAY, HOUR, MINUTE, etc.)
      const intervalToken = '___INTERVAL_KEYWORD___';
      query = query.replace(/\bINTERVAL\s+(?=\S+\s+(?:DAY|HOUR|MINUTE|SECOND|MONTH|YEAR|WEEK))/gi, `${intervalToken} `);

      // Escape 'interval' column name - now safe to escape all remaining occurrences
      // Handle table aliases like s.interval -> s.`interval`
      query = query.replace(/\binterval\b/gi, '`interval`');

      // Escape 'read' column name
      query = query.replace(/\bread\b/gi, '`read`');

      // Restore INTERVAL keyword
      query = query.replace(new RegExp(intervalToken, 'g'), 'INTERVAL');

      // Handle multi-statement queries - MySQL doesn't support them by default
      // Remove SELECT LAST_INSERT_ID() or SELECT SCOPE_IDENTITY() after INSERT
      if (query.includes(';')) {
        const statements = query.split(';').map(s => s.trim()).filter(s => s.length > 0);
        // If first is INSERT and second is SELECT LAST_INSERT_ID, just run INSERT
        if (statements.length >= 1 && statements[0].toUpperCase().startsWith('INSERT')) {
          query = statements[0];
        }
      }

      try {
        console.log('DEBUG: Executing Query:', query);
        console.log('DEBUG: Params:', paramValues);
        const [rows] = await pool.execute(query, paramValues);

        // Handle different query types
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          return { recordset: rows };
        } else if (query.trim().toUpperCase().startsWith('INSERT')) {
          return {
            recordset: [{ id: rows.insertId }],
            rowsAffected: [rows.affectedRows],
            lastInsertRowid: rows.insertId
          };
        } else {
          return { recordset: [], rowsAffected: [rows.affectedRows] };
        }
      } catch (error) {
        console.error('SQL Error:', error.message);
        console.error('Query:', query);
        console.error('Params:', paramValues);
        throw error;
      }
    }
  };
};

const poolPromise = Promise.resolve({
  request: createRequest
});

// Initialize database on startup
const init = initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});

// Dummy sql object for compatibility
const sql = {
  Int: 'Int',
  NVarChar: 'NVarChar',
  DateTime: 'DateTime',
  Bit: 'Bit'
};

export { sql, poolPromise, init };
