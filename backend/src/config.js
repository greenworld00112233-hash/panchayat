const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.VERCEL
  ? '/tmp/panchayat.db'
  : path.resolve(__dirname, '../data/panchayat.db');

// Ensure data folder exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!process.env.VERCEL && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
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
  
  // Demo Citizen
  const citizenHash = await bcrypt.hash('citizen123', salt);
  await runQuery(`
    INSERT OR IGNORE INTO users (id, name, role, village, contact, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['c1', 'Ramesh Kumar', 'citizen', 'Rajpur', '9876543210', citizenHash]);

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
