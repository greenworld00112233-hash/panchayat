const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb, runQuery, getQuery, allQuery } = require('./config');
const { classifyComplaint } = require('./classifier');
const { sendNotification } = require('./notification');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'panchayat_secret_key_123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.resolve(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsDir));

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Helper to log audit actions
async function logAudit(complaintId, userId, action) {
  const id = 'log_' + Math.random().toString(36).substr(2, 9);
  await runQuery(`
    INSERT INTO audit_logs (id, complaint_id, user_id, action)
    VALUES (?, ?, ?, ?)
  `, [id, complaintId, userId, action]);
}

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { name, contact, password, village, role } = req.body;
  if (!name || !contact || !password) {
    return res.status(400).json({ error: 'Name, contact, and password are required' });
  }

  const userRole = role || 'citizen';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const userId = 'usr_' + Math.random().toString(36).substr(2, 9);

  try {
    await runQuery(`
      INSERT INTO users (id, name, role, village, contact, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, name, userRole, village || '', contact, hash]);
    res.json({ success: true, userId });
  } catch (err) {
    res.status(500).json({ error: 'User already exists or database error: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { contact, password } = req.body;
  if (!contact || !password) {
    return res.status(400).json({ error: 'Contact and password are required' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE contact = ?', [contact]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role, village: user.village }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, village: user.village, contact: user.contact }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Upload Route ---
app.post('/api/upload', async (req, res) => {
  const { fileName, fileData } = req.body; // fileData is base64 string
  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'Filename and base64 data required' });
  }

  try {
    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    const safeName = Date.now() + '_' + fileName.replace(/[^a-z0-9.]/gi, '_');
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);
    res.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload: ' + err.message });
  }
});

// --- Complaints Routes ---
app.post('/api/complaints', authenticateToken, async (req, res) => {
  const { description, photoUrl, voiceUrl } = req.body;
  if (!description) return res.status(400).json({ error: 'Description is required' });

  const id = 'cmp_' + Math.random().toString(36).substr(2, 9);
  
  // AI Categorization / NLP Classification
  let deptId = classifyComplaint(description);

  try {
    await runQuery(`
      INSERT INTO complaints (id, citizen_id, description, department_id, status, photo_url, voice_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, description, deptId, 'Submitted', photoUrl || null, voiceUrl || null]);

    await logAudit(id, req.user.id, 'Submitted new complaint');

    // Send notifications
    await sendNotification(
      id,
      req.user.contact,
      `Your grievance has been submitted successfully. Tracking ID: ${id}`,
      'sms'
    );

    res.json({ success: true, complaintId: id, assignedDepartment: deptId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, u.name as citizen_name, u.contact as citizen_contact, u.village as citizen_village, d.name as department_name
      FROM complaints c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
    `;
    let params = [];

    if (req.user.role === 'citizen') {
      query += ' WHERE c.citizen_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'department') {
      // Find operator's assigned department based on their name or custom mapping, let's look at their ID
      // To simplify, we mapping e1->electricity, w1->water, r1->roads, cl1->cleaning
      let deptId = '';
      if (req.user.id.startsWith('e')) deptId = 'electricity';
      else if (req.user.id.startsWith('w')) deptId = 'water';
      else if (req.user.id.startsWith('r')) deptId = 'roads';
      else if (req.user.id.startsWith('cl')) deptId = 'cleaning';
      
      query += ' WHERE c.department_id = ?';
      params.push(deptId);
    }

    query += ' ORDER BY c.created_at DESC';
    const list = await allQuery(query, params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
  const { departmentId, status } = req.body;
  const complaintId = req.params.id;

  try {
    const old = await getQuery('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!old) return res.status(404).json({ error: 'Complaint not found' });

    let updates = [];
    let params = [];

    if (departmentId !== undefined) {
      updates.push('department_id = ?');
      params.push(departmentId);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(complaintId);
    await runQuery(`UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`, params);

    // Audit Log
    const actionDesc = `Updated status to "${status || old.status}" and assigned department to "${departmentId || old.department_id}"`;
    await logAudit(complaintId, req.user.id, actionDesc);

    // Get citizen contact for notification
    const citizen = await getQuery('SELECT contact FROM users WHERE id = ?', [old.citizen_id]);
    if (citizen) {
      await sendNotification(
        complaintId,
        citizen.contact,
        `Update on Grievance ${complaintId}: Status is now "${status || old.status}".`,
        'whatsapp'
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complaints/:id/feedback', authenticateToken, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating is required' });

  try {
    await runQuery(`
      UPDATE complaints
      SET feedback_rating = ?, feedback_comment = ?
      WHERE id = ? AND citizen_id = ?
    `, [rating, comment || '', req.params.id, req.user.id]);
    
    await logAudit(req.params.id, req.user.id, `Submitted rating ${rating} stars`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Comments Routes ---
app.post('/api/complaints/:id/comments', authenticateToken, async (req, res) => {
  const { text, visibility } = req.body;
  if (!text || !visibility) return res.status(400).json({ error: 'Text and visibility are required' });

  // Map user ID to department
  let deptId = 'admin';
  if (req.user.id.startsWith('e')) deptId = 'electricity';
  else if (req.user.id.startsWith('w')) deptId = 'water';
  else if (req.user.id.startsWith('r')) deptId = 'roads';
  else if (req.user.id.startsWith('cl')) deptId = 'cleaning';

  const id = 'cmt_' + Math.random().toString(36).substr(2, 9);
  try {
    await runQuery(`
      INSERT INTO comments (id, complaint_id, department_id, text, visibility)
      VALUES (?, ?, ?, ?, ?)
    `, [id, req.params.id, deptId, text, visibility]);

    await logAudit(req.params.id, req.user.id, `Added ${visibility} comment: "${text.substring(0, 20)}..."`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/complaints/:id/comments', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, d.name as department_name
      FROM comments c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.complaint_id = ?
    `;
    let params = [req.params.id];

    if (req.user.role === 'citizen') {
      query += " AND c.visibility = 'public'";
    }

    query += ' ORDER BY c.created_at ASC';
    const comments = await allQuery(query, params);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Departments Route ---
app.get('/api/departments', async (req, res) => {
  try {
    const list = await allQuery('SELECT * FROM departments');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    // Total, Pending, Resolved
    const summary = await getQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Process' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
      FROM complaints
    `);

    // Complaints per Department
    const deptStats = await allQuery(`
      SELECT d.name as department, COUNT(c.id) as count
      FROM departments d
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id
    `);

    // Audit logs
    const logs = await allQuery(`
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC LIMIT 50
    `);

    res.json({ summary, deptStats, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Database & Express Server
if (!process.env.VERCEL) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  initDb().catch(err => console.error('Database initialization error:', err.message));
}

module.exports = app;
