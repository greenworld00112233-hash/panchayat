const fs = require('fs');
const path = require('path');
const { runQuery } = require('./config');

const logPath = path.resolve(__dirname, '../data/notifications_log.json');

// Ensure log file exists
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, JSON.stringify([], null, 2));
}

async function sendNotification(complaintId, contact, message, type = 'sms') {
  console.log(`[Notification Service] Sending ${type.toUpperCase()} to ${contact}: "${message}"`);
  
  // Store notification in DB
  const notificationId = 'notif_' + Math.random().toString(36).substr(2, 9);
  try {
    await runQuery(`
      INSERT INTO notifications (id, complaint_id, message, type)
      VALUES (?, ?, ?, ?)
    `, [notificationId, complaintId, message, type]);
  } catch (err) {
    console.error('Error inserting notification into DB:', err.message);
  }

  // Also write to simulated logs
  try {
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    logs.push({
      id: notificationId,
      complaint_id: complaintId,
      contact,
      message,
      type,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error logging notification file:', err);
  }

  return { success: true, notificationId };
}

module.exports = { sendNotification };
