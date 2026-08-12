import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, User, Wrench, Languages, Mic, MicOff, 
  WifiOff, Image, Plus, LogOut, CheckCircle2, AlertCircle, Clock, 
  MessageSquare, Star, ArrowRight, Download, Eye, EyeOff, BarChart3, Lock
} from 'lucide-react';

// --- Translation Strings (English & Hindi) ---
const translations = {
  en: {
    title: "Gram Panchayat Grievance System",
    subtitle: "Empowering villagers, resolving complaints transparently.",
    citizenDash: "Citizen Dashboard",
    adminDash: "Sarpanch Admin Dashboard",
    deptDash: "Department Dashboard",
    submitNew: "Submit Grievance",
    trackStatus: "Track Complaint",
    voiceInput: "Voice Input (Hindi/English)",
    offlineKiosk: "Offline Kiosk Mode (Queue Offline, Syncs when Online)",
    name: "Name",
    mobile: "Mobile Number",
    village: "Village Name",
    desc: "Describe your issue",
    photo: "Attach Photo / Document (Optional)",
    submit: "Submit Complaint",
    trackingId: "Complaint ID",
    status: "Current Status",
    submitted: "Submitted",
    inProcess: "In Process",
    resolved: "Resolved",
    comments: "Departmental Updates & Comments",
    feedback: "Grievance Resolution Feedback",
    rateUs: "How would you rate the resolution quality?",
    submitFeedback: "Submit Feedback",
    adminActions: "Admin & Allocation Actions",
    deptClean: "Cleaning & Sanitation",
    deptWater: "Water Supply",
    deptElec: "Electricity & Lights",
    deptRoad: "Roads & Paths",
    exportData: "Export Analytics Report",
    assignedTo: "Assigned To",
    commentsHeading: "Internal/Public Comments",
    public: "Public",
    internal: "Internal",
    addComment: "Post Comment",
    logout: "Logout",
    login: "Sign In / Register",
    roleCitizen: "Villager (Citizen)",
    roleAdmin: "Sarpanch / Admin",
    roleDept: "Department Operator",
    authSubtitle: "Select your role to login or register",
    noComplaints: "No complaints found.",
    aiSuggested: "AI Suggested Department"
  },
  hi: {
    title: "ग्राम पंचायत शिकायत निवारण प्रणाली",
    subtitle: "ग्रामीणों का सशक्तिकरण, शिकायतों का पारदर्शी समाधान।",
    citizenDash: "नागरिक डैशबोर्ड",
    adminDash: "सरपंच / व्यवस्थापक डैशबोर्ड",
    deptDash: "विभाग डैशबोर्ड",
    submitNew: "शिकायत दर्ज करें",
    trackStatus: "शिकायत की स्थिति देखें",
    voiceInput: "आवाज इनपुट (हिंदी/अंग्रेजी)",
    offlineKiosk: "ऑफ़लाइन कियोस्क मोड (ऑफ़लाइन कतार, ऑनलाइन होने पर सिंक)",
    name: "नाम",
    mobile: "मोबाइल नंबर",
    village: "गांव का नाम",
    desc: "अपनी समस्या का विवरण दें",
    photo: "फोटो / दस्तावेज संलग्न करें (वैकल्पिक)",
    submit: "शिकायत सबमिट करें",
    trackingId: "शिकायत संख्या (ID)",
    status: "वर्तमान स्थिति",
    submitted: "जमा किया गया",
    inProcess: "प्रक्रिया में",
    resolved: "समाधान हो गया",
    comments: "विभागीय अपडेट और टिप्पणियां",
    feedback: "शिकायत समाधान फीडबैक",
    rateUs: "आप समाधान की गुणवत्ता को कैसे रेट करेंगे?",
    submitFeedback: "प्रतिक्रिया सबमिट करें",
    adminActions: "प्रशासनिक कार्य",
    deptClean: "सफाई एवं स्वच्छता",
    deptWater: "जलापूर्ति",
    deptElec: "बिजली और लाइट",
    deptRoad: "सड़कें और रास्ते",
    exportData: "एनालिटिक्स रिपोर्ट निर्यात करें",
    assignedTo: "सौंपा गया",
    commentsHeading: "आंतरिक/सार्वजनिक टिप्पणियां",
    public: "सार्वजनिक",
    internal: "आंतरिक",
    addComment: "टिप्पणी पोस्ट करें",
    logout: "लॉगआउट",
    login: "साइन इन / रजिस्टर",
    roleCitizen: "ग्रामीण (नागरिक)",
    roleAdmin: "सरपंच / व्यवस्थापक",
    roleDept: "विभाग ऑपरेटर",
    authSubtitle: "लॉगिन या पंजीकरण करने के लिए अपनी भूमिका चुनें",
    noComplaints: "कोई शिकायत नहीं मिली।",
    aiSuggested: "एआई द्वारा सुझाया गया विभाग"
  }
};

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  
  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // login / register
  const [selectedRole, setSelectedRole] = useState('citizen');
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
  
  // New Complaint Form
  const [complaintForm, setComplaintForm] = useState({ description: '', photo: null });
  const [isListening, setIsListening] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Admin & Analytics State
  const [analytics, setAnalytics] = useState(null);
  
  // Fetch lists
  useEffect(() => {
    // Sync network status
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
      // Decode simple payload (mock decoder or split)
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
  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Speech recognition not supported in this browser', 'error');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    rec.continuous = false;
    rec.interimResults = false;
    
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setComplaintForm(prev => ({ ...prev, description: prev.description + ' ' + text }));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    
    rec.start();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setComplaintForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      showNotification('Description is required', 'error');
      return;
    }

    if (!isOnline) {
      // Offline Kiosk queuing
      const offlineItem = {
        id: 'off_' + Math.random().toString(36).substr(2, 9),
        description: complaintForm.description,
        photo: complaintForm.photo,
        created_at: new Date().toISOString()
      };
      const updatedQueue = [...offlineQueue, offlineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('offline_grievances', JSON.stringify(updatedQueue));
      showNotification('Offline Kiosk: Grievance queued. Will sync when online!', 'warning');
      setComplaintForm({ description: '', photo: null });
      return;
    }

    // Direct Online Submission
    try {
      let photoUrl = null;
      if (complaintForm.photo) {
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'grievance.jpg', fileData: complaintForm.photo })
        });
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;
      }

      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: complaintForm.description, photoUrl })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Grievance submitted successfully! ID: ${data.complaintId}`);
        setComplaintForm({ description: '', photo: null });
        fetchComplaints();
      } else {
        showNotification(data.error, 'error');
      }
    } catch (err) {
      showNotification('Failed to submit grievance', 'error');
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

        await fetch(`${API_BASE}/complaints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ description: item.description, photoUrl })
        });
      } catch (e) {
        console.error('Failed to sync item:', item.id, e);
      }
    }
    localStorage.removeItem('offline_grievances');
    setOfflineQueue([]);
    showNotification('All offline complaints synced successfully!');
    fetchComplaints();
  };

  const selectComplaintDetail = async (c) => {
    setSelectedComplaint(c);
    // Fetch comments
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
      if (res.ok) {
        showNotification('Complaint updated successfully');
        fetchComplaints();
        fetchAnalytics();
        // Refresh details
        const updated = complaints.find(item => item.id === id);
        if (updated) {
          selectComplaintDetail({ ...updated, status, department_id: departmentId });
        }
      }
    } catch (err) {
      showNotification('Failed to update complaint', 'error');
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
        // Refresh comments list
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

        {/* Auth Module */}
        {!token || !user ? (
          <div style={{ maxWidth: '500px', margin: '80px auto' }} className="glass-panel">
            <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>{t.login}</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>{t.authSubtitle}</p>
            
            {/* Role selection tab */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['citizen', 'admin', 'department'].map((r) => (
                <button
                  key={r}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: selectedRole === r ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedRole(r)}
                >
                  {r === 'citizen' ? t.roleCitizen : r === 'admin' ? t.roleAdmin : t.roleDept}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">{t.name}</label>
                  <input
                    type="text"
                    className="input-control"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t.mobile}</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={authForm.contact}
                  onChange={(e) => setAuthForm({ ...authForm, contact: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input-control"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              {authMode === 'register' && selectedRole === 'citizen' && (
                <div className="form-group">
                  <label className="form-label">{t.village}</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Rajpur"
                    value={authForm.village}
                    onChange={(e) => setAuthForm({ ...authForm, village: e.target.value })}
                  />
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} type="submit">
                {authMode === 'login' ? 'Sign In' : 'Register'}
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <a
                  href="#"
                  style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                  }}
                >
                  {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
                </a>
              </div>
            </form>
          </div>
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

            {/* CITIZEN DASHBOARD LAYOUT */}
            {user.role === 'citizen' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Submit Panel */}
                <div className="glass-panel">
                  <h3>{t.submitNew}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Record voice or type description. AI will automatically assign it.
                  </p>

                  <form onSubmit={submitComplaint}>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label">{t.desc}</label>
                        <button
                          type="button"
                          onClick={startSpeech}
                          className="btn"
                          style={{
                            background: isListening ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                          {t.voiceInput}
                        </button>
                      </div>
                      <textarea
                        rows="5"
                        className="input-control"
                        placeholder="Type complaint here..."
                        value={complaintForm.description}
                        onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t.photo}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="input-control"
                        style={{ padding: '8px' }}
                      />
                      {complaintForm.photo && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={complaintForm.photo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} />
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%' }} type="submit">
                      <Plus size={18} />
                      {t.submit}
                    </button>
                  </form>
                </div>

                {/* Track Status / Complaints list */}
                <div className="glass-panel">
                  <h3>Track Grievances</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Select a complaint below to see interactive status timeline & QR code.
                  </p>

                  {complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                      <p>{t.noComplaints}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
                      {complaints.map((c) => (
                        <div
                          key={c.id}
                          className="glass-panel"
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            borderLeft: selectedComplaint?.id === c.id ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            background: selectedComplaint?.id === c.id ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)'
                          }}
                          onClick={() => selectComplaintDetail(c)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'white' }}>{c.id}</span>
                            <span style={{
                              background: c.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'In Process' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                              color: c.status === 'Resolved' ? 'var(--accent-primary)' : c.status === 'In Process' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              {c.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {c.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN DASHBOARD LAYOUT */}
            {user.role === 'admin' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <div className="glass-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>All Registered Grievances</h3>
                    <button className="btn btn-secondary" onClick={exportReport} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Download size={16} />
                      {t.exportData}
                    </button>
                  </div>

                  {complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                      <p>{t.noComplaints}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                      {complaints.map((c) => (
                        <div
                          key={c.id}
                          className="glass-panel"
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            borderLeft: selectedComplaint?.id === c.id ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            background: selectedComplaint?.id === c.id ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)'
                          }}
                          onClick={() => selectComplaintDetail(c)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontWeight: 700, color: 'white', marginRight: '10px' }}>{c.id}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>by {c.citizen_name} ({c.citizen_village})</span>
                            </div>
                            <span style={{
                              background: c.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'In Process' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                              color: c.status === 'Resolved' ? 'var(--accent-primary)' : c.status === 'In Process' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              {c.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {c.description}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                              Department: {c.department_name || 'Unassigned (Awaiting Allocation)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Quick Analytics Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass-panel">
                    <h3>Panchayat Overview</h3>
                    {analytics?.summary ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{analytics.summary.total}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Received</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{analytics.summary.pending}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{analytics.summary.processing}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>In Process</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{analytics.summary.resolved}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resolved</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Loading analytics...</p>
                    )}
                  </div>

                  <div className="glass-panel">
                    <h3>Resolution by Department</h3>
                    {analytics?.deptStats ? (
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {analytics.deptStats.map(stat => (
                          <div key={stat.department}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                              <span>{stat.department}</span>
                              <span style={{ fontWeight: 600 }}>{stat.count}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                              <div style={{
                                height: '100%',
                                background: 'var(--accent-primary)',
                                borderRadius: '4px',
                                width: `${analytics.summary.total ? (stat.count / analytics.summary.total) * 100 : 0}%`
                              }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)' }}>Loading department stats...</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DEPARTMENT DASHBOARD LAYOUT */}
            {user.role === 'department' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <div className="glass-panel">
                  <h3>Assigned Grievances</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Showing complaints designated to your department. Click one to manage.
                  </p>

                  {complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                      <p>{t.noComplaints}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                      {complaints.map((c) => (
                        <div
                          key={c.id}
                          className="glass-panel"
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            borderLeft: selectedComplaint?.id === c.id ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            background: selectedComplaint?.id === c.id ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)'
                          }}
                          onClick={() => selectComplaintDetail(c)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'white' }}>{c.id}</span>
                            <span style={{
                              background: c.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'In Process' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                              color: c.status === 'Resolved' ? 'var(--accent-primary)' : c.status === 'In Process' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              {c.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {c.description}
                          </p>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Villager Contact: {c.citizen_contact}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Departmental Analytics */}
                <div className="glass-panel">
                  <h3>Department Statistics</h3>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{complaints.length}</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Grievances</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {complaints.filter(c => c.status === 'Resolved').length}
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resolved Grievances</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                        {complaints.filter(c => c.status === 'In Process' || c.status === 'Submitted').length}
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting Resolution</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAIL / INTERACTION MODAL SECTION */}
            {selectedComplaint && (
              <div className="glass-panel" style={{ marginTop: '40px', padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Grievance Details
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>#{selectedComplaint.id}</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Submitted by {selectedComplaint.citizen_name || user.name} from {selectedComplaint.citizen_village || user.village}
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setSelectedComplaint(null)}>Close</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                  <div>
                    <h4>Description</h4>
                    <p style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginTop: '8px', lineHeight: '1.6' }}>
                      {selectedComplaint.description}
                    </p>

                    {selectedComplaint.photo_url && (
                      <div style={{ marginTop: '20px' }}>
                        <h4>Supporting Document / Photo</h4>
                        <img src={`http://localhost:5000${selectedComplaint.photo_url}`} alt="Attached support" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginTop: '8px' }} />
                      </div>
                    )}

                    {/* Progress Bar Component */}
                    <div style={{ marginTop: '30px' }}>
                      <h4>{t.status}</h4>
                      <div className="progress-container">
                        <div className="progress-line"></div>
                        <div className="progress-active-line" style={{
                          width: selectedComplaint.status === 'Resolved' ? '100%' : selectedComplaint.status === 'In Process' ? '50%' : '0%'
                        }}></div>
                        
                        <div className={`progress-step ${selectedComplaint.status === 'Submitted' || selectedComplaint.status === 'In Process' || selectedComplaint.status === 'Resolved' ? 'completed' : ''}`}>1</div>
                        <div className={`progress-step ${selectedComplaint.status === 'In Process' || selectedComplaint.status === 'Resolved' ? 'completed' : ''}`}>2</div>
                        <div className={`progress-step ${selectedComplaint.status === 'Resolved' ? 'completed' : ''}`}>3</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>{t.submitted}</span>
                        <span>{t.inProcess}</span>
                        <span>{t.resolved}</span>
                      </div>
                    </div>

                    {/* Feedback Rating system for citizens */}
                    {user.role === 'citizen' && selectedComplaint.status === 'Resolved' && !selectedComplaint.feedback_rating && (
                      <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h4>{t.feedback}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{t.rateUs}</p>
                        <form onSubmit={postFeedback}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => setFeedback({ ...feedback, rating: star })}
                              >
                                <Star
                                  size={30}
                                  fill={star <= feedback.rating ? 'var(--accent-secondary)' : 'none'}
                                  color={star <= feedback.rating ? 'var(--accent-secondary)' : 'var(--text-secondary)'}
                                />
                              </button>
                            ))}
                          </div>
                          <div className="form-group">
                            <input
                              type="text"
                              className="input-control"
                              placeholder="Any comments or suggestions..."
                              value={feedback.comment}
                              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                            />
                          </div>
                          <button className="btn btn-primary" type="submit">{t.submitFeedback}</button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Right side options: Admin / Department settings and Comments */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px' }}>
                    {/* Admin assignment details */}
                    {user.role === 'admin' && (
                      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                        <h4>Grievance Allocation</h4>
                        {/* NLP Classification recommendation info */}
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '10px',
                          borderRadius: '6px',
                          margin: '10px 0',
                          fontSize: '0.85rem'
                        }}>
                          <strong>🤖 {t.aiSuggested}: </strong> 
                          {classifyComplaint(selectedComplaint.description) || 'None (Needs Manual)'}
                        </div>

                        <div className="form-group" style={{ marginTop: '14px' }}>
                          <label className="form-label">Assign Department</label>
                          <select
                            className="input-control"
                            value={selectedComplaint.department_id || ''}
                            onChange={(e) => updateComplaintStatus(selectedComplaint.id, selectedComplaint.status, e.target.value)}
                          >
                            <option value="">Select department...</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Update Status</label>
                          <select
                            className="input-control"
                            value={selectedComplaint.status}
                            onChange={(e) => updateComplaintStatus(selectedComplaint.id, e.target.value, selectedComplaint.department_id)}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="In Process">In Process</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Department operators status updates */}
                    {user.role === 'department' && (
                      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                        <h4>Resolution Status</h4>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                          <label className="form-label">Set Status</label>
                          <select
                            className="input-control"
                            value={selectedComplaint.status}
                            onChange={(e) => updateComplaintStatus(selectedComplaint.id, e.target.value, selectedComplaint.department_id)}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="In Process">In Process</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* QR Code tracking container */}
                    <div style={{ textAlign: 'center', marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '12px' }}>
                      <p style={{ color: 'var(--bg-dark)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>Scan to Track on Mobile</p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=http://localhost:5173/track/${selectedComplaint.id}`}
                        alt="Tracking QR Code"
                        style={{ border: '1px solid #ccc', borderRadius: '6px' }}
                      />
                    </div>

                    {/* Comments list & posting */}
                    <div>
                      <h4>{t.commentsHeading}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                        {comments.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No comments yet.</p>
                        ) : (
                          comments.map((cmt) => (
                            <div key={cmt.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                <span>{cmt.department_name || 'Admin'}</span>
                                <span style={{
                                  background: cmt.visibility === 'public' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: cmt.visibility === 'public' ? 'var(--accent-primary)' : 'var(--accent-danger)',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {cmt.visibility.toUpperCase()}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.85rem' }}>{cmt.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment if admin or department */}
                      {user.role !== 'citizen' && (
                        <form onSubmit={postComment} style={{ marginTop: '16px' }}>
                          <div className="form-group">
                            <input
                              type="text"
                              className="input-control"
                              placeholder="Type a comment..."
                              required
                              value={newComment.text}
                              onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="radio"
                                  name="visibility"
                                  checked={newComment.visibility === 'public'}
                                  onChange={() => setNewComment({ ...newComment, visibility: 'public' })}
                                />
                                Public
                              </label>
                              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="radio"
                                  name="visibility"
                                  checked={newComment.visibility === 'internal'}
                                  onChange={() => setNewComment({ ...newComment, visibility: 'internal' })}
                                />
                                Internal
                              </label>
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              {t.addComment}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
