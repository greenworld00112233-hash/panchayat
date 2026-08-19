import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DeptDashboard({
  user,
  complaints,
  selectedComplaint,
  selectComplaintDetail,
  t
}) {
  return (
    <div className="grid-dashboard">
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
  );
}
