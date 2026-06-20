import { useState, useEffect } from 'react';
import api from '../api';

const CATEGORY_LABELS = {
  graphicViolence: 'Graphic Violence',
  hateSymbols: 'Hate Symbols',
  selfHarm: 'Self-Harm',
  extremistPropaganda: 'Extremist Propaganda',
  weaponsContraband: 'Weapons & Contraband',
  harassmentHumiliation: 'Harassment & Humiliation',
};

function VerdictBadge({ outcome }) {
  const map = {
    'Approved': 'badge-success',
    'Flagged for Review': 'badge-warning',
    'Blocked': 'badge-danger',
  };
  return <span className={`badge ${map[outcome] || 'badge-warning'}`}>{outcome}</span>;
}

function ImageUploader({ onSubmitted }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/submissions', { imageUrl: imageBase64 });
      onSubmitted(data);
      setImagePreview(null);
      setImageBase64(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Check if GEMINI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>📤 Submit Image for Review</h2>

        <label
          htmlFor="image-upload"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: imagePreview ? 'none' : '2px dashed rgba(79, 70, 229, 0.4)', borderRadius: '12px', padding: '2.5rem',
            cursor: 'pointer', transition: 'all 0.2s', minHeight: '220px',
            background: imagePreview ? 'none' : 'rgba(255,255,255,0.4)',
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" style={{ maxHeight: '250px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          ) : (
            <>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '1rem' }}>Click or drag an image here</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>PNG, JPG, WEBP (Max 5MB)</span>
            </>
          )}
        <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>

      {error && <p style={{ color: 'var(--danger-color)', marginTop: '0.75rem', fontSize: '0.875rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button id="submit-image-btn" className="btn btn-primary" onClick={handleSubmit} disabled={!imageBase64 || loading} style={{ flex: 1, padding: '0.875rem', fontSize: '1rem' }}>
          {loading ? '⏳ Analyzing with Gemini AI...' : '🚀 Submit for Moderation'}
        </button>
        {imagePreview && (
          <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.1)' }} onClick={() => { setImagePreview(null); setImageBase64(null); }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function VerdictCard({ verdict }) {
  const [expanded, setExpanded] = useState(false);
  if (!verdict) return null;
  return (
    <div className="glass-panel" style={{ border: verdict.overallOutcome === 'Blocked' ? '1px solid var(--danger-color)' : verdict.overallOutcome === 'Approved' ? '1px solid var(--success-color)' : '1px solid var(--warning-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600 }}>AI Verdict</span>
        <VerdictBadge outcome={verdict.overallOutcome} />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        {new Date(verdict.createdAt).toLocaleString()}
      </p>
      <button
        className="btn"
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.04)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.05)' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▲ Hide Details' : '▼ View Category Breakdown'}
      </button>
      {expanded && verdict.categoryBreakdown && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {verdict.categoryBreakdown.map((cat) => (
            <div key={cat.category} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{CATEGORY_LABELS[cat.category] || cat.category}</span>
                <span className={`badge ${cat.classification ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                  {cat.classification ? 'DETECTED' : 'CLEAN'}
                </span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '4px', height: '6px', marginBottom: '0.6rem' }}>
                <div style={{
                  width: `${cat.confidenceScore}%`, height: '100%', borderRadius: '4px',
                  background: cat.confidenceScore > 70 ? 'var(--danger-color)' : cat.confidenceScore > 40 ? 'var(--warning-color)' : 'var(--success-color)'
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Confidence: {cat.confidenceScore}% — {cat.reasoning}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppealForm({ submissionId, onFiled }) {
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/appeals', { submissionId, justification });
      onFiled();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file appeal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <div className="form-group">
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Justification</label>
        <textarea
          className="form-input"
          rows={3}
          placeholder="Explain why this verdict should be overturned..."
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          required
          style={{ resize: 'vertical' }}
        />
      </div>
      {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{error}</p>}
      <button id="file-appeal-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: '0.875rem' }}>
        {loading ? 'Filing...' : '📩 File Appeal'}
      </button>
    </form>
  );
}

function SubmissionCard({ submission, onAppealFiled }) {
  const [showAppeal, setShowAppeal] = useState(false);
  const verdict = submission.verdictId;
  const canAppeal = verdict && (verdict.overallOutcome === 'Flagged for Review' || verdict.overallOutcome === 'Blocked');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {new Date(submission.createdAt).toLocaleString()}
        </span>
        {verdict && <VerdictBadge outcome={verdict.overallOutcome} />}
      </div>
      {verdict && <VerdictCard verdict={verdict} />}
      {canAppeal && !showAppeal && (
        <button id={`appeal-btn-${submission._id}`} className="btn" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', border: '1px solid var(--warning-color)', fontSize: '0.875rem' }} onClick={() => setShowAppeal(true)}>
          ⚖️ File an Appeal
        </button>
      )}
      {showAppeal && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: 0 }}>Appeal this Decision</h4>
          <AppealForm submissionId={submission._id} onFiled={() => { setShowAppeal(false); onAppealFiled(); }} />
        </div>
      )}
    </div>
  );
}

function UserDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestVerdict, setLatestVerdict] = useState(null);

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get('/submissions');
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleSubmitted = (data) => {
    setLatestVerdict(data.verdict);
    fetchSubmissions();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Content Submission</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Upload an image to be evaluated by the AI moderation system.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 450px) 1fr', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
          <ImageUploader onSubmitted={handleSubmitted} />
          {latestVerdict && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>✨ Latest Result</h3>
              <VerdictCard verdict={latestVerdict} />
            </div>
          )}
        </div>

        <div style={{ paddingLeft: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📋</span> Submission History ({submissions.length})
          </h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : submissions.length === 0 ? (
            <div className="glass-panel text-center">
              <p style={{ color: 'var(--text-secondary)' }}>No submissions yet. Upload your first image!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {submissions.map(s => (
                <SubmissionCard key={s._id} submission={s} onAppealFiled={fetchSubmissions} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
