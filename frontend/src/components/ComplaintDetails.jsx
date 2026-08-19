import React from 'react';
import { Star } from 'lucide-react';
import { classifyComplaint } from '../translations';

export default function ComplaintDetails({
  selectedComplaint,
  setSelectedComplaint,
  user,
  departments,
  updateComplaintStatus,
  comments,
  newComment,
  setNewComment,
  postComment,
  feedback,
  setFeedback,
  postFeedback,
  t
}) {
  if (!selectedComplaint) return null;

  return (
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

      <div className="grid-details">
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
              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(window.location.origin + '/track/' + selectedComplaint.id)}`}
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
  );
}
