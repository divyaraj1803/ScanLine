export default function GeminiPanel({ gemini }) {
  const { status, verdict, confidence, reasoning } = gemini
  const isAI    = verdict === 'AI_GENERATED'
  const running = status === 'running'
  const done    = status === 'done'
  const error   = status === 'error'

  const badgeStyle = done
    ? { background: isAI ? 'var(--fake-red-bg)' : 'var(--real-green-bg)', color: isAI ? 'var(--fake-red)' : 'var(--real-green)' }
    : running
    ? { background: 'rgba(180,83,9,0.08)', color: 'var(--amber)' }
    : { background: 'rgba(15,23,42,0.06)', color: 'var(--text-dim)' }

  const badgeText = done
    ? (isAI ? 'AI DETECTED' : 'AUTHENTIC')
    : running ? 'RUNNING...' : error ? 'ERROR' : 'IDLE'

  return (
    <div className="gemini-panel" style={{ marginTop: '1.5rem' }}>
      <div className="gemini-header">
        <i className="fa-brands fa-google" style={{ fontSize: '1rem', color: 'var(--cyan)' }} />
        <span className="gemini-label">GEMINI AI VERIFICATION</span>
        <span className="gemini-status-badge" style={badgeStyle}>{badgeText}</span>
      </div>
      <div className="gemini-result">
        {running && (
          <>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--amber)' }} />
            <span>Sending image to Gemini 1.5 Flash for AI content analysis...</span>
          </>
        )}
        {done && (
          <>
            <i className="fa-brands fa-google" style={{ color: isAI ? 'var(--fake-red)' : 'var(--real-green)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: isAI ? 'var(--fake-red)' : 'var(--real-green)', fontSize: '0.82rem' }}>
                {isAI ? 'AI-Generated' : 'Likely Authentic'}&nbsp;·&nbsp;{confidence}% confidence
              </div>
              {reasoning && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.15rem' }}>{reasoning}</div>
              )}
            </div>
          </>
        )}
        {error && (
          <>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--fake-red)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Gemini verification failed: {reasoning}</span>
          </>
        )}
        {status === 'idle' && (
          <>
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--text-dim)' }} />
            <span>Gemini analysis will run automatically after upload.</span>
          </>
        )}
      </div>
    </div>
  )
}
