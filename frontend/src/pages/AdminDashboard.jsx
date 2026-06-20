import { useState, useEffect } from 'react';
import api from '../api';

const CATEGORY_KEYS = ['graphicViolence', 'hateSymbols', 'selfHarm', 'extremistPropaganda', 'weaponsContraband', 'harassmentHumiliation'];
const CATEGORY_LABELS = {
  graphicViolence: 'Graphic Violence',
  hateSymbols: 'Hate Symbols',
  selfHarm: 'Self-Harm',
  extremistPropaganda: 'Extremist Propaganda',
  weaponsContraband: 'Weapons & Contraband',
  harassmentHumiliation: 'Harassment & Humiliation',
};

/* ── Analytics Panel ─────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <div className="glass-panel text-center" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function SimpleBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{value} ({pct}%)</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '4px', height: '8px' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-panel"><p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p></div>;
  if (!data) return null;

  const { totalSubmissions, outcomeDistribution, totalAppeals, appealOutcomes, topUsers } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid grid-3">
        <StatCard label="Total Submissions" value={totalSubmissions} color="var(--primary-color)" />
        <StatCard label="Total Appeals" value={totalAppeals} color="var(--warning-color)" />
        <StatCard label="Blocked Content" value={outcomeDistribution['Blocked'] || 0} color="var(--danger-color)" />
      </div>

      <div className="grid grid-2">
        <div className="glass-panel">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📊 Verdict Distribution</h3>
          <SimpleBar label="Approved" value={outcomeDistribution['Approved'] || 0} total={totalSubmissions} color="var(--success-color)" />
          <SimpleBar label="Flagged for Review" value={outcomeDistribution['Flagged for Review'] || 0} total={totalSubmissions} color="var(--warning-color)" />
          <SimpleBar label="Blocked" value={outcomeDistribution['Blocked'] || 0} total={totalSubmissions} color="var(--danger-color)" />
        </div>

        <div className="glass-panel">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>⚖️ Appeal Outcomes</h3>
          <SimpleBar label="Accepted" value={appealOutcomes['Accepted'] || 0} total={totalAppeals || 1} color="var(--success-color)" />
          <SimpleBar label="Rejected" value={appealOutcomes['Rejected'] || 0} total={totalAppeals || 1} color="var(--danger-color)" />
          <SimpleBar label="Pending" value={appealOutcomes['Pending'] || 0} total={totalAppeals || 1} color="var(--warning-color)" />
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>👥 Top Users by Submissions</h3>
        {topUsers && topUsers.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ paddingBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Rank</th>
                <th style={{ paddingBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Username</th>
                <th style={{ paddingBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Submissions</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.6rem 0' }}>#{i + 1}</td>
                  <td style={{ padding: '0.6rem 0' }}>{u.username}</td>
                  <td style={{ padding: '0.6rem 0' }}>{u.submissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No submission data yet.</p>
        )}
      </div>
    </div>
  );
}

/* ── Policy Configuration Panel ─────────────────────────── */
function PolicyPanel() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/policies/active')
      .then(r => setPolicy(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (cat, field, value) => {
    setPolicy(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [cat]: {
          ...prev.categories[cat],
          [field]: field === 'confidenceThreshold' ? Number(value) : value,
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/policies/update', { categories: policy.categories });
      setPolicy(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save policy: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="glass-panel"><p style={{ color: 'var(--text-secondary)' }}>Loading policy...</p></div>;

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>🛡️ Moderation Policy Configuration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Configure thresholds and enforcement actions for each category.</p>
        </div>
        <button id="save-policy-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Policy'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {CATEGORY_KEYS.map(cat => {
          const catData = policy?.categories?.[cat] || {};
          return (
            <div key={cat} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{CATEGORY_LABELS[cat]}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Category</div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => handleChange(cat, 'enabled', !catData.enabled)}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', background: catData.enabled ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px', left: catData.enabled ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s'
                  }} />
                </div>
                <span style={{ color: catData.enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {catData.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threshold</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={catData.confidenceThreshold ?? 80}
                    onChange={(e) => handleChange(cat, 'confidenceThreshold', e.target.value)}
                    style={{ width: '100px', accentColor: 'var(--primary-color)' }}
                    disabled={!catData.enabled}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '35px' }}>{catData.confidenceThreshold ?? 80}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Action</span>
                <select
                  className="form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', minWidth: '160px' }}
                  value={catData.enforcementBehavior || 'Flag for Review'}
                  onChange={(e) => handleChange(cat, 'enforcementBehavior', e.target.value)}
                  disabled={!catData.enabled}
                >
                  <option value="Flag for Review">Flag for Review</option>
                  <option value="Auto-Block">Auto-Block</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Appeals Queue ─────────────────────────── */
function AppealsPanel() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});

  const fetchAppeals = async () => {
    try {
      const { data } = await api.get('/appeals/pending');
      setAppeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppeals(); }, []);

  const handleReview = async (appealId, status) => {
    try {
      await api.put(`/appeals/${appealId}/review`, { status, adminResponse: responses[appealId] || '' });
      fetchAppeals();
    } catch (err) {
      alert('Failed to review: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>⚖️ Pending Appeals ({appeals.length})</h2>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : appeals.length === 0 ? (
        <div className="glass-panel text-center">
          <p style={{ color: 'var(--text-secondary)' }}>No pending appeals. ✓</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appeals.map(appeal => (
            <div key={appeal._id} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>@{appeal.userId?.username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(appeal.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  "{appeal.justification}"
                </p>
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Admin Response (optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  style={{ resize: 'vertical', fontSize: '0.85rem' }}
                  value={responses[appeal._id] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [appeal._id]: e.target.value }))}
                  placeholder="Write a note to the user..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button id={`accept-appeal-${appeal._id}`} className="btn" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success-color)', border: '1px solid var(--success-color)', flex: 1 }} onClick={() => handleReview(appeal._id, 'Accepted')}>
                  ✓ Accept Appeal
                </button>
                <button id={`reject-appeal-${appeal._id}`} className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', flex: 1 }} onClick={() => handleReview(appeal._id, 'Rejected')}>
                  ✗ Reject Appeal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Admin Dashboard ─────────────────────────── */
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'appeals', label: '⚖️ Appeals Queue' },
    { id: 'policy', label: '🛡️ Policy Config' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage moderation policies, review appeals, and monitor platform analytics.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.6rem 1.25rem', fontFamily: 'inherit',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s', fontSize: '0.9rem', marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && <AnalyticsPanel />}
      {activeTab === 'appeals' && <AppealsPanel />}
      {activeTab === 'policy' && <PolicyPanel />}
    </div>
  );
}

export default AdminDashboard;
