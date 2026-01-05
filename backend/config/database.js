import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data.db');

let db = null;
let SQL = null;

// Initialize SQL.js and database
const init = (async () => {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      plan TEXT DEFAULT 'free',
      plan_expires_at TEXT,
      email_verified INTEGER DEFAULT 0,
      whatsapp TEXT,
      whatsapp_verified INTEGER DEFAULT 0,
      google_id TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add columns if they don't exist (for existing databases)
  try {
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch (e) { /* column exists */ }
  try {
    db.run(`ALTER TABLE users ADD COLUMN google_id TEXT`);
  } catch (e) { /* column exists */ }
  try {
    db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`);
  } catch (e) { /* column exists */ }

  // Page visits table for visitor analytics
  db.run(`
    CREATE TABLE IF NOT EXISTS page_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      interval INTEGER DEFAULT 5,
      email_notif INTEGER DEFAULT 1,
      whatsapp_notif INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unknown',
      last_check TEXT,
      response_time INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS server_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      status_code INTEGER,
      response_time INTEGER,
      status TEXT,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id TEXT UNIQUE NOT NULL,
      transaction_id TEXT,
      amount INTEGER NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_type TEXT,
      midtrans_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      server_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      server_down INTEGER DEFAULT 1,
      slow_response INTEGER DEFAULT 1,
      daily_summary INTEGER DEFAULT 0,
      slow_threshold INTEGER DEFAULT 3000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  save();
  save();


  // Seed Admin User
  const adminCheck = db.prepare("SELECT count(*) as count FROM users WHERE email = 'admin@mycheckserver.com'");
  adminCheck.step();
  const adminExists = adminCheck.getAsObject().count;
  adminCheck.free();

  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO users (name, email, password, role, email_verified) VALUES ('Administrator', 'admin@mycheckserver.com', '${hash}', 'admin', 1)`);
    const idStmt = db.prepare("SELECT last_insert_rowid() as id");
    idStmt.step();
    const userId = idStmt.getAsObject().id;
    idStmt.free();
    db.run(`INSERT INTO notification_settings (user_id) VALUES (${userId})`);
    console.log('Admin user seeded');
  }

  save();
  console.log('Database initialized');
})();

function save() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Wrapper compatible with better-sqlite3 API
const wrapper = {
  prepare(sql) {
    return {
      run(...args) {
        if (!db) throw new Error('Database not initialized');
        const params = (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) ? args[0] : args;
        db.run(sql, params);
        save();
        // Get last insert rowid using prepared statement
        const stmt = db.prepare("SELECT last_insert_rowid() as id");
        stmt.step();
        const result = stmt.getAsObject();
        const lastId = result.id || 0;
        stmt.free();
        console.log('INSERT lastInsertRowid:', lastId, 'result:', result);
        return { changes: db.getRowsModified(), lastInsertRowid: lastId };
      },
      get(...args) {
        if (!db) throw new Error('Database not initialized');
        const params = (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) ? args[0] : args;
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...args) {
        if (!db) throw new Error('Database not initialized');
        const params = (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) ? args[0] : args;
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    save();
  },
  pragma() {
    // No-op for sql.js
  }
};

export default wrapper;
export { init };
