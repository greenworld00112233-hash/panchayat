import React from 'react';
import { Download, AlertCircle } from 'lucide-react';

export default function AdminDashboard({
  complaints,
  selectedComplaint,
  selectComplaintDetail,
  analytics,
  exportReport,
  t
}) {
  return (
    <div className="grid-dashboard">
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
            <div className="grid-stats">
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
  );
}
