const path = require('path');
const bcrypt = require('bcryptjs');


const isPostgresConfigured = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('xxxxxx') && 
  process.env.DATABASE_URL.startsWith('postgres');

let pgPool = null;
let sqliteDb = null;
let usePostgres = isPostgresConfigured;

if (isPostgresConfigured) {
  console.log('Using PostgreSQL database configuration.');
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false
  });
  pgPool.on('connect', () => {
    console.log('Connected to PostgreSQL database.');
  });
  pgPool.on('error', (err) => {
    console.error('PostgreSQL connection pool error:', err.message);
  });
}

function initSqlite() {
  if (sqliteDb) return;
  console.log('Initializing local SQLite database fallback...');
  
  let sqlite3;
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (err) {
    console.error('CRITICAL: sqlite3 native module failed to load. Local database fallback is unavailable on this platform. Error:', err.message);
    sqliteDb = {
      run: (sql, params, cb) => cb(new Error('SQLite database is unavailable on this platform (native binary missing). Please configure a PostgreSQL DATABASE_URL in Vercel.')),
      get: (sql, params, cb) => cb(new Error('SQLite database is unavailable on this platform (native binary missing). Please configure a PostgreSQL DATABASE_URL in Vercel.')),
      all: (sql, params, cb) => cb(new Error('SQLite database is unavailable on this platform (native binary missing). Please configure a PostgreSQL DATABASE_URL in Vercel.'))
    };
    return;
  }

  const dbDir = path.resolve(__dirname, '../data');
  const fs = require('fs');
  
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create data directory, using in-memory database instead.');
  }

  // On serverless Vercel, the filesystem is read-only, so write SQLite to /tmp or use memory
  let dbPath;
  if (process.env.VERCEL) {
    dbPath = '/tmp/panchayat.sqlite';
  } else {
    dbPath = path.join(dbDir, 'panchayat.sqlite');
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log(`Connected to SQLite database at: ${dbPath}`);
    }
  });
}

if (!isPostgresConfigured) {
  console.log('PostgreSQL DATABASE_URL not set or contains placeholders. Falling back to SQLite.');
  initSqlite();
}

function preprocessSql(sql) {
  let processed = sql;
  
  if (usePostgres) {
    // Convert SQLite "INSERT OR IGNORE" to PostgreSQL "ON CONFLICT" syntax
    if (processed.includes('INSERT OR IGNORE INTO departments')) {
      processed = processed.replace('INSERT OR IGNORE INTO departments', 'INSERT INTO departments');
      processed += ' ON CONFLICT (id) DO NOTHING';
    } else if (processed.includes('INSERT OR IGNORE INTO users')) {
      processed = processed.replace('INSERT OR IGNORE INTO users', 'INSERT INTO users');
      processed += ' ON CONFLICT (id) DO NOTHING';
    }

    // Convert SQLite ? to PostgreSQL $1, $2, ...
    let count = 1;
    processed = processed.replace(/\?/g, () => `$${count++}`);
  }
  return processed;
}

const runQuery = async (sql, params = []) => {
  if (usePostgres) {
    try {
      const query = preprocessSql(sql);
      return await pgPool.query(query, params);
    } catch (err) {
      console.error('PostgreSQL query failed. Automatically falling back to SQLite database. Error:', err.message);
      usePostgres = false;
      initSqlite();
      return runQuery(sql, params);
    }
  } else {
    initSqlite();
    const query = preprocessSql(sql);
    return new Promise((resolve, reject) => {
      sqliteDb.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

const getQuery = async (sql, params = []) => {
  if (usePostgres) {
    try {
      const query = preprocessSql(sql);
      const result = await pgPool.query(query, params);
      return result.rows[0];
    } catch (err) {
      console.error('PostgreSQL query failed. Automatically falling back to SQLite database. Error:', err.message);
      usePostgres = false;
      initSqlite();
      return getQuery(sql, params);
    }
  } else {
    initSqlite();
    const query = preprocessSql(sql);
    return new Promise((resolve, reject) => {
      sqliteDb.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const allQuery = async (sql, params = []) => {
  if (usePostgres) {
    try {
      const query = preprocessSql(sql);
      const result = await pgPool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL query failed. Automatically falling back to SQLite database. Error:', err.message);
      usePostgres = false;
      initSqlite();
      return allQuery(sql, params);
    }
  } else {
    initSqlite();
    const query = preprocessSql(sql);
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

async function initDb() {
  // Define helper for checks because SQLite/PostgreSQL CHECK syntax can vary slightly, 
  // but standard SQL syntax defined here is supported by both.
  
  // Create Users Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      village TEXT,
      contact TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `);

  // Create Departments Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create Complaints Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL,
      description TEXT NOT NULL,
      department_id TEXT,
      status TEXT DEFAULT 'Submitted',
      photo_url TEXT,
      voice_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      feedback_rating INTEGER,
      feedback_comment TEXT,
      FOREIGN KEY(citizen_id) REFERENCES users(id),
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )
  `);

  // Create Comments Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      text TEXT NOT NULL,
      visibility TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(complaint_id) REFERENCES complaints(id),
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )
  `);

  // Create Notifications Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'sms',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(complaint_id) REFERENCES complaints(id)
    )
  `);

  // Create Audit Logs Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Departments
  const departments = ['Electricity', 'Water', 'Roads', 'Cleaning'];
  for (const dept of departments) {
    try {
      await runQuery('INSERT OR IGNORE INTO departments (id, name) VALUES (?, ?)', [dept.toLowerCase(), dept]);
    } catch (e) {
      console.error('Department seeding skipped/already exists:', e.message);
    }
  }

  // Seed Demo Users
  const salt = await bcrypt.genSalt(10);
  
  // Demo Admin
  const adminHash = await bcrypt.hash('admin123', salt);
  try {
    await runQuery(`
      INSERT OR IGNORE INTO users (id, name, role, village, contact, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['a1', 'Sarpanch Amit Singh', 'admin', 'Rajpur', '9900990099', adminHash]);
  } catch (e) {
    console.error('Admin seeding skipped/already exists:', e.message);
  }

  // Demo Department Officials
  const deptHash = await bcrypt.hash('dept123', salt);
  const deptUserIds = {
    electricity: 'e1',
    water: 'w1',
    roads: 'r1',
    cleaning: 'cl1'
  };

  for (const [deptId, userId] of Object.entries(deptUserIds)) {
    const deptName = deptId.charAt(0).toUpperCase() + deptId.slice(1);
    try {
      await runQuery(`
        INSERT OR IGNORE INTO users (id, name, role, village, contact, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, `${deptName} Officer`, 'department', 'Rajpur', `900000000${userId === 'e1' ? '1' : userId === 'w1' ? '2' : userId === 'r1' ? '3' : '4'}`, deptHash]);
    } catch (e) {
      console.error(`Dept ${deptId} seeding skipped/already exists:`, e.message);
    }
  }

  console.log('Database schema initialized and seeded.');
}

module.exports = {
  db: isPostgresConfigured ? pgPool : sqliteDb,
  runQuery,
  getQuery,
  allQuery,
  initDb
};
