import React, { useState, useEffect } from 'react';
import { Languages, ShieldCheck, LogOut, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations, classifyComplaint } from './translations';
import AuthCard from './components/AuthCard';
import PublicPortal from './components/PublicPortal';
import AdminDashboard from './components/AdminDashboard';
import DeptDashboard from './components/DeptDashboard';
import ComplaintDetails from './components/ComplaintDetails';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  
  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // login / register
  const [selectedRole, setSelectedRole] = useState('admin');
  const [authForm, setAuthForm] = useState({ name: '', contact: '', password: '', village: '' });
  
  // System State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(JSON.parse(localStorage.getItem('offline_grievances') || '[]'));
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ text: '', visibility: 'public' });
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  
  // Public & Staff Complaint States
  const [publicForm, setPublicForm] = useState({ name: '', contact: '', village: '', description: '', photo: null });
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedComplaints, setTrackedComplaints] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStaffPortal, setShowStaffPortal] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Admin & Analytics State
  const [analytics, setAnalytics] = useState(null);
  
  // Fetch lists
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        fetchComplaints();
        fetchDepartments();
        if (payload.role === 'admin' || payload.role === 'department') {
          fetchAnalytics();
        }
      } catch (e) {
        handleLogout();
      }
    }
  }, [token]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const data = await res.json();
      if (res.ok) setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'register';
    const body = authMode === 'login' 
      ? { contact: authForm.contact, password: authForm.password }
      : { ...authForm, role: selectedRole };
      
    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Authentication failed', 'error');
        return;
      }
      
      if (authMode === 'login') {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        showNotification('Login successful');
      } else {
        showNotification('Registration successful! Please login.');
        setAuthMode('login');
      }
    } catch (err) {
      showNotification('Network/Server connection error', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setComplaints([]);
    setSelectedComplaint(null);
  };

  // Web Speech API Voice Recognition
  const startSpeech = (field = 'description') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Speech recognition not supported in this browser', 'error');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    rec.continuous = false;
    rec.interimResults = false;
    
    rec.onstart = () => setListeningField(field);
    rec.onresult = (e) => {
      let text = e.results[0][0].transcript;
      if (field === 'contact') {
        text = text.replace(/\D/g, '');
      }
      setPublicForm(prev => {
        const currentVal = prev[field] || '';
        const newVal = currentVal 
          ? (field === 'contact' ? currentVal + text : currentVal + ' ' + text)
          : text;
        return { ...prev, [field]: newVal };
      });
    };
    rec.onerror = () => setListeningField(null);
    rec.onend = () => setListeningField(null);
    
    rec.start();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPublicForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Public submission handler
  const submitPublicComplaint = async (e) => {
    e.preventDefault();
    if (!publicForm.name.trim() || !publicForm.contact.trim() || !publicForm.description.trim()) {
      showNotification('Name, contact number, and description are required', 'error');
      return;
    }

    if (!isOnline) {
      const offlineItem = {
        id: 'off_' + Math.random().toString(36).substr(2, 9),
        name: publicForm.name,
        contact: publicForm.contact,
        village: publicForm.village,
        description: publicForm.description,
        photo: publicForm.photo,
        created_at: new Date().toISOString()
      };
      const updatedQueue = [...offlineQueue, offlineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('offline_grievances', JSON.stringify(updatedQueue));
      showNotification('Offline Kiosk: Grievance queued. Will sync when online!', 'warning');
      setPublicForm({ name: '', contact: '', village: '', description: '', photo: null });
      return;
    }

    try {
      let photoUrl = null;
      if (publicForm.photo) {
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'grievance.jpg', fileData: publicForm.photo })
        });
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;
      }

      const res = await fetch(`${API_BASE}/public/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: publicForm.name,
          contact: publicForm.contact,
          village: publicForm.village,
          description: publicForm.description,
          photoUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Grievance submitted successfully! Tracking ID: ${data.complaintId}`);
        setTrackQuery(data.complaintId);
        setPublicForm({ name: '', contact: '', village: '', description: '', photo: null });
        performTrackLookup(data.complaintId);
      } else {
        showNotification(data.error, 'error');
      }
    } catch (err) {
      showNotification('Failed to submit grievance', 'error');
    }
  };

  const performTrackLookup = async (queryVal) => {
    if (!queryVal.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/public/complaints/track?query=${encodeURIComponent(queryVal)}`);
      const data = await res.json();
      if (res.ok) {
        setTrackedComplaints(data);
        if (data.length === 0) {
          showNotification('No matching complaints found', 'warning');
        }
      } else {
        showNotification(data.error, 'error');
      }
    } catch (err) {
      showNotification('Failed to fetch tracking data', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const downloadReceipt = (c) => {
    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grievance Receipt - ${c.id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .receipt-card {
            background: rgba(30, 41, 59, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            text-align: center;
            box-sizing: border-box;
        }
        .header {
            margin-bottom: 20px;
        }
        .header h1 {
            color: #10b981;
            font-size: 1.6rem;
            margin: 0 0 6px 0;
            font-weight: 800;
        }
        .header p {
            color: #94a3b8;
            font-size: 0.85rem;
            margin: 0;
        }
        .divider {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            margin: 18px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            margin-bottom: 18px;
        }
        .details-table th, .details-table td {
            padding: 6px 0;
            font-size: 0.9rem;
        }
        .details-table th {
            color: #94a3b8;
            font-weight: 500;
            width: 40%;
        }
        .details-table td {
            color: #f8fafc;
            font-weight: 600;
        }
        .qr-section {
            background: white;
            padding: 14px;
            border-radius: 12px;
            display: inline-block;
            margin-bottom: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .qr-section img {
            display: block;
            margin: 0 auto;
        }
        .qr-section p {
            color: #0f172a;
            font-size: 0.75rem;
            font-weight: 800;
            margin: 0 0 6px 0;
        }
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        .btn {
            flex: 1;
            padding: 10px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            font-size: 0.85rem;
        }
        .btn-print {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        .btn-print:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        @media print {
            body {
                background: white !important;
                color: black !important;
            }
            .receipt-card {
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
            }
            .actions {
                display: none !important;
            }
            .details-table td {
                color: black !important;
            }
            .details-table th {
                color: #555 !important;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-card">
        <div class="header">
            <h1>Official Receipt</h1>
            <p>Gram Panchayat Grievance Redressal System</p>
        </div>
        <div class="divider"></div>
        <table class="details-table">
            <tr>
                <th>Complaint ID:</th>
                <td>${c.id}</td>
            </tr>
            <tr>
                <th>Date:</th>
                <td>${new Date(c.created_at).toLocaleString()}</td>
            </tr>
            <tr>
                <th>Status:</th>
                <td>${c.status}</td>
            </tr>
            <tr>
                <th>Citizen Name:</th>
                <td>${c.citizen_name || c.name || 'Anonymous'}</td>
            </tr>
            <tr>
                <th>Mobile Number:</th>
                <td>${c.citizen_contact || c.contact || 'N/A'}</td>
            </tr>
            <tr>
                <th>Village:</th>
                <td>${c.citizen_village || c.village || 'N/A'}</td>
            </tr>
            <tr>
                <th>Department:</th>
                <td>${c.department_name || 'Awaiting Allocation'}</td>
            </tr>
        </table>
        <div class="divider"></div>
        <div style="margin-bottom: 20px; text-align: left;">
            <strong style="color: #94a3b8; font-size: 0.9rem;">Description:</strong>
            <p style="margin: 6px 0 0 0; font-size: 0.9rem; line-height: 1.4; color: #e2e8f0;">${c.description}</p>
        </div>
        <div class="divider"></div>
        <div class="qr-section">
            <p>Scan to Track Status</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/track/' + c.id)}" alt="Tracking QR Code">
        </div>
        <div class="actions">
            <button class="btn btn-print" onclick="window.print()">Print / Save PDF</button>
        </div>
    </div>
</body>
</html>`;
    const element = document.createElement("a");
    const file = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${c.id}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('Receipt downloaded successfully!');
  };

  const handleTrackSearch = (e) => {
    e.preventDefault();
    performTrackLookup(trackQuery);
  };

  const submitPublicFeedback = async (complaintId, rating, comment) => {
    try {
      const res = await fetch(`${API_BASE}/public/complaints/${complaintId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        showNotification('Thank you for your feedback!');
        performTrackLookup(trackQuery);
      } else {
        const data = await res.json();
        showNotification(data.error, 'error');
      }
    } catch (err) {
      showNotification('Failed to post feedback', 'error');
    }
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    showNotification('Syncing offline complaints with Gram Panchayat server...');
    for (const item of offlineQueue) {
      try {
        let photoUrl = null;
        if (item.photo) {
          const uploadRes = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'grievance.jpg', fileData: item.photo })
          });
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }

        if (item.name && item.contact) {
          await fetch(`${API_BASE}/public/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              contact: item.contact,
              village: item.village,
              description: item.description,
              photoUrl
            })
          });
        }
      } catch (e) {
        console.error('Failed to sync item:', item.id, e);
      }
    }
    localStorage.removeItem('offline_grievances');
    setOfflineQueue([]);
    showNotification('All offline complaints synced successfully!');
    if (token) fetchComplaints();
  };

  const selectComplaintDetail = async (c) => {
    setSelectedComplaint(c);
    try {
      const res = await fetch(`${API_BASE}/complaints/${c.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateComplaintStatus = async (id, status, departmentId) => {
    try {
      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, departmentId })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Complaint updated successfully');
        fetchComplaints();
        fetchAnalytics();
        setSelectedComplaint(prev => {
          if (prev && prev.id === id) {
            return { ...prev, status, department_id: departmentId };
          }
          return prev;
        });
      } else {
        showNotification(data.error || 'Failed to update complaint status', 'error');
      }
    } catch (err) {
      console.error('Update status error:', err);
      showNotification('Failed to update complaint: Network/Connection error', 'error');
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newComment)
      });
      if (res.ok) {
        showNotification('Comment posted');
        setNewComment({ text: '', visibility: 'public' });
        selectComplaintDetail(selectedComplaint);
      }
    } catch (err) {
      showNotification('Failed to post comment', 'error');
    }
  };

  const postFeedback = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/complaints/${selectedComplaint.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(feedback)
      });
      if (res.ok) {
        showNotification('Thank you for your feedback!');
        setFeedback({ rating: 5, comment: '' });
        fetchComplaints();
        setSelectedComplaint(null);
      }
    } catch (err) {
      showNotification('Failed to post feedback', 'error');
    }
  };

  const exportReport = () => {
    const reportData = {
      analytics: analytics,
      complaints: complaints
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gram_Panchayat_Grievance_Report_${Date.now()}.json`;
    a.click();
    showNotification('Report exported successfully');
  };

  return (
    <div>
      {/* Top Offline Indicator */}
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {t.offlineKiosk}
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">{t.title}</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} style={{ padding: '8px 12px' }}>
            <Languages size={18} />
            {lang === 'en' ? 'Hindi' : 'English'}
          </button>
          {!token && (
            <button className="btn btn-primary" onClick={() => {
              setShowStaffPortal(!showStaffPortal);
              setSelectedRole('admin');
            }} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} />
              {showStaffPortal ? 'Villager Portal' : 'Staff/Sarpanch Portal'}
            </button>
          )}
          {token && (
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 12px' }}>
              <LogOut size={18} />
              {t.logout}
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ padding: '30px 5%', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Notification Toast */}
        {notification && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            background: notification.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-primary)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Auth / Public Portal Module */}
        {!token || !user ? (
          showStaffPortal ? (
            <AuthCard
              authForm={authForm}
              setAuthForm={setAuthForm}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              handleAuth={handleAuth}
              t={t}
            />
          ) : (
            <PublicPortal
              publicForm={publicForm}
              setPublicForm={setPublicForm}
              submitPublicComplaint={submitPublicComplaint}
              listeningField={listeningField}
              startSpeech={startSpeech}
              handlePhotoUpload={handlePhotoUpload}
              trackQuery={trackQuery}
              setTrackQuery={setTrackQuery}
              handleTrackSearch={handleTrackSearch}
              isSearching={isSearching}
              trackedComplaints={trackedComplaints}
              downloadReceipt={downloadReceipt}
              submitPublicFeedback={submitPublicFeedback}
              t={t}
            />
          )
        ) : (
          <div>
            {/* Dashboard Headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--accent-primary)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {user.role} Dashboard
                </span>
                <h1 style={{ marginTop: '8px' }}>Namaste, {user.name}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.subtitle}</p>
              </div>
            </div>

            {/* ADMIN DASHBOARD LAYOUT */}
            {user.role === 'admin' && (
              <AdminDashboard
                complaints={complaints}
                selectedComplaint={selectedComplaint}
                selectComplaintDetail={selectComplaintDetail}
                analytics={analytics}
                exportReport={exportReport}
                t={t}
              />
            )}

            {/* DEPARTMENT DASHBOARD LAYOUT */}
            {user.role === 'department' && (
              <DeptDashboard
                user={user}
                complaints={complaints}
                selectedComplaint={selectedComplaint}
                selectComplaintDetail={selectComplaintDetail}
                t={t}
              />
            )}

            {/* SHARED DETAILS / INTERACTION MODAL SECTION */}
            <ComplaintDetails
              selectedComplaint={selectedComplaint}
              setSelectedComplaint={setSelectedComplaint}
              user={user}
              departments={departments}
              updateComplaintStatus={updateComplaintStatus}
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              postComment={postComment}
              feedback={feedback}
              setFeedback={setFeedback}
              postFeedback={postFeedback}
              t={t}
            />
          </div>
        )}
      </main>
    </div>
  );
}
