const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables locally
if (!process.env.VERCEL) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection pool error:', err.message);
});

const db = pool;

function preprocessSql(sql) {
  let processed = sql;
  
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
  return processed;
}

const runQuery = async (sql, params = []) => {
  const query = preprocessSql(sql);
  const result = await pool.query(query, params);
  return result;
};

const getQuery = async (sql, params = []) => {
  const query = preprocessSql(sql);
  const result = await pool.query(query, params);
  return result.rows[0];
};

const allQuery = async (sql, params = []) => {
  const query = preprocessSql(sql);
  const result = await pool.query(query, params);
  return result.rows;
};

async function initDb() {
  // Create Users Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('citizen', 'admin', 'department')) NOT NULL,
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
      status TEXT CHECK(status IN ('Submitted', 'In Process', 'Resolved')) DEFAULT 'Submitted',
      photo_url TEXT,
      voice_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      feedback_rating INTEGER CHECK(feedback_rating BETWEEN 1 AND 5),
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
      visibility TEXT CHECK(visibility IN ('public', 'internal')) NOT NULL,
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
      type TEXT CHECK(type IN ('sms', 'whatsapp')) DEFAULT 'sms',
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
      console.error(e);
    }
  }

  // Seed Demo Users
  const salt = await bcrypt.genSalt(10);
  
  // Demo Admin
  const adminHash = await bcrypt.hash('admin123', salt);
  await runQuery(`
    INSERT OR IGNORE INTO users (id, name, role, village, contact, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['a1', 'Sarpanch Amit Singh', 'admin', 'Rajpur', '9900990099', adminHash]);

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
    await runQuery(`
      INSERT OR IGNORE INTO users (id, name, role, village, contact, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, `${deptName} Officer`, 'department', 'Rajpur', `900000000${userId === 'e1' ? '1' : userId === 'w1' ? '2' : userId === 'r1' ? '3' : '4'}`, deptHash]);
  }

  console.log('Database schema initialized and seeded.');
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  initDb
};
