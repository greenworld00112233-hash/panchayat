import React from 'react';

export default function AuthCard({
  authForm,
  setAuthForm,
  selectedRole,
  setSelectedRole,
  handleAuth,
  t
}) {
  return (
    <div style={{ maxWidth: '500px', margin: '80px auto' }} className="glass-panel">
      <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Staff & Sarpanch Portal</h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
        Sign in to manage and allocate village grievances
      </p>
      
      {/* Role selection tab (Staff only) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['admin', 'department'].map((r) => (
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
            {r === 'admin' ? t.roleAdmin : t.roleDept}
          </button>
        ))}
      </div>

      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label className="form-label">{t.mobile}</label>
          <input
            type="text"
            className="input-control"
            required
            placeholder="e.g. 9900990099"
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

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} type="submit">
          Sign In
        </button>
      </form>
    </div>
  );
}
