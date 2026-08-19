import React from 'react';
import { Plus, Mic, MicOff, Clock, AlertCircle, Download, Star } from 'lucide-react';

export default function PublicPortal({
  publicForm,
  setPublicForm,
  submitPublicComplaint,
  listeningField,
  startSpeech,
  handlePhotoUpload,
  trackQuery,
  setTrackQuery,
  handleTrackSearch,
  isSearching,
  isSubmitting,
  trackedComplaints,
  downloadReceipt,
  submitPublicFeedback,
  t
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '45px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t.subtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Submit Panel */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Plus size={22} style={{ color: 'var(--accent-primary)' }} />
            {t.submitNew}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Record your voice or type the description. Your grievance will be automatically classified by AI.
          </p>

          <form onSubmit={submitPublicComplaint}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label">{t.name} <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <button
                  type="button"
                  onClick={() => startSpeech('name')}
                  className="btn"
                  style={{
                    background: listeningField === 'name' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {listeningField === 'name' ? <MicOff size={14} /> : <Mic size={14} />}
                  {t.voiceInput}
                </button>
              </div>
              <input
                type="text"
                className="input-control"
                placeholder="Your Name / आपका नाम"
                required
                value={publicForm.name}
                onChange={(e) => setPublicForm({ ...publicForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label">{t.mobile} <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <button
                  type="button"
                  onClick={() => startSpeech('contact')}
                  className="btn"
                  style={{
                    background: listeningField === 'contact' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {listeningField === 'contact' ? <MicOff size={14} /> : <Mic size={14} />}
                  {t.voiceInput}
                </button>
              </div>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. 9876543210"
                required
                value={publicForm.contact}
                onChange={(e) => setPublicForm({ ...publicForm, contact: e.target.value })}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label">{t.village}</label>
                <button
                  type="button"
                  onClick={() => startSpeech('village')}
                  className="btn"
                  style={{
                    background: listeningField === 'village' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {listeningField === 'village' ? <MicOff size={14} /> : <Mic size={14} />}
                  {t.voiceInput}
                </button>
              </div>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Rajpur / रामपुर"
                value={publicForm.village}
                onChange={(e) => setPublicForm({ ...publicForm, village: e.target.value })}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label">{t.desc} <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <button
                  type="button"
                  onClick={() => startSpeech('description')}
                  className="btn"
                  style={{
                    background: listeningField === 'description' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {listeningField === 'description' ? <MicOff size={14} /> : <Mic size={14} />}
                  {t.voiceInput}
                </button>
              </div>
              <textarea
                rows="5"
                className="input-control"
                placeholder="Type complaint here... / अपनी शिकायत यहाँ लिखें..."
                value={publicForm.description}
                onChange={(e) => setPublicForm({ ...publicForm, description: e.target.value })}
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
              {publicForm.photo && (
                <div style={{ marginTop: '12px' }}>
                  <img src={publicForm.photo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }} 
              type="submit"
              disabled={isSubmitting}
            >
              <Plus size={18} />
              {isSubmitting ? 'Submitting...' : t.submit}
            </button>
          </form>
        </div>

        {/* Track Panel */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Clock size={22} style={{ color: 'var(--accent-primary)' }} />
            {t.trackStatus}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Enter your Complaint Tracking ID or Mobile Number to see updates.
          </p>

          <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Enter ID (cmp_...) or Mobile Number"
              required
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={isSearching} style={{ whiteSpace: 'nowrap' }}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {trackedComplaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <AlertCircle size={32} style={{ marginBottom: '8px' }} />
              <p>No complaints searched yet. Use the search box above to track your issues.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
              {trackedComplaints.map((c) => (
                <div key={c.id} className="glass-panel" style={{ padding: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'white' }}>{c.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({new Date(c.created_at).toLocaleDateString()})
                      </span>
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

                  <p style={{ fontSize: '0.95rem', color: 'white', marginBottom: '10px' }}>{c.description}</p>
                  
                  {c.photo_url && (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={`http://localhost:5000${c.photo_url}`} alt="Grievance Attachment" style={{ maxWidth: '120px', borderRadius: '4px' }} />
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                    Assigned Department: <strong>{c.department_name || 'Awaiting Allocation'}</strong>
                  </div>

                  {/* QR Code tracking container */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(window.location.origin + '/track/' + c.id)}`}
                      alt="Tracking QR Code"
                      style={{ width: '90px', height: '90px', border: '1px solid #eee', borderRadius: '6px' }}
                    />
                    <div>
                      <p style={{ color: 'var(--bg-dark)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '4px' }}>Scan to Track on Mobile / मोबाइल पर ट्रैक करें</p>
                      <p style={{ color: '#666', fontSize: '0.75rem' }}>Scan this QR code with your phone to view and track your complaint's progress.</p>
                    </div>
                  </div>

                  {/* Status tracker steps */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                    {['Submitted', 'In Process', 'Resolved'].map((s, idx) => {
                      const statuses = ['Submitted', 'In Process', 'Resolved'];
                      const currentIdx = statuses.indexOf(c.status);
                      const isCompleted = idx <= currentIdx;
                      return (
                        <div key={s} style={{ flex: 1, textAlign: 'center', opacity: isCompleted ? 1 : 0.4 }}>
                          <div style={{ height: '4px', background: isCompleted ? 'var(--accent-primary)' : 'var(--border-color)', marginBottom: '6px' }}></div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Panel (Download Receipt) */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => downloadReceipt(c)}
                      className="btn btn-secondary"
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
                    >
                      <Download size={16} />
                      {t.downloadReceipt}
                    </button>
                  </div>

                  {/* Comments */}
                  {c.comments && c.comments.length > 0 && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <h5 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Department Updates:</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {c.comments.map((comm) => (
                          <div key={comm.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '4px' }}>
                              {comm.department_name}
                            </div>
                            <p style={{ color: 'white' }}>{comm.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Public Feedback Form */}
                  {c.status === 'Resolved' && !c.feedback_rating && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', background: 'rgba(16,185,129,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <h5 style={{ marginBottom: '8px', color: 'var(--accent-primary)' }}>Resolution Feedback</h5>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => submitPublicFeedback(c.id, star, '')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: star <= 5 ? '#f59e0b' : '#374151' }}
                          >
                            <Star size={20} fill={star <= 5 ? '#f59e0b' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.feedback_rating && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ⭐ Rated: <strong>{c.feedback_rating} / 5</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
