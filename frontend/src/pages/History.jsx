import { useState, useEffect } from 'react'
import { generatePDFReport } from '../utils/pdfExport'

export default function History() {
  const [entries, setEntries] = useState([])
  const [search, setSearch]   = useState('')

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('scanline_history') || '[]')
      setEntries(data)
    } catch { setEntries([]) }
  }, [])

  const filtered = entries.filter(e =>
    e.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    (e.isDeepfake ? 'ai' : 'authentic').includes(search.toLowerCase())
  )

  const clearAll = () => {
    localStorage.removeItem('scanline_history')
    setEntries([])
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
      <p className="mono-label" style={{ marginBottom: '0.5rem' }}>
        <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '0.4rem' }} />
        FORENSIC SCAN HISTORY
      </p>
      <h1 className="heading-xl" style={{ marginBottom: '0.6rem' }}>Scan History</h1>
      <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
        Past scans are stored locally in your browser. Nothing is sent to any server.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <input
          className="form-input" style={{ maxWidth: 320 }}
          placeholder="Search by filename or verdict..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {entries.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={clearAll}>
            <i className="fa-solid fa-trash" /> Clear All
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }} />
          <p className="mono-label">No scan history yet.</p>
          <p style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>Upload an image on the Scanner page to get started.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="history-table">
            <thead>
              <tr>
                {['#', 'File', 'Verdict', 'Confidence', 'Size', 'Date', 'Report'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id || i}>
                  <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.fileName}
                  </td>
                  <td>
                    <span className={`badge ${e.isDeepfake ? 'badge-fake' : 'badge-real'}`}>
                      <i className={`fa-solid ${e.isDeepfake ? 'fa-triangle-exclamation' : 'fa-circle-check'}`} />
                      {e.isDeepfake ? 'AI GENERATED' : 'AUTHENTIC'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: e.isDeepfake ? 'var(--fake-red)' : 'var(--real-green)', fontSize: '0.82rem' }}>
                    {e.confidenceScore}%
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{e.fileSize}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--text-dim)' }}>
                    {e.timestamp ? new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.55rem', fontSize: '0.70rem' }}
                      onClick={() => generatePDFReport(e)}
                      title="Download PDF Forensic Certificate"
                    >
                      <i className="fa-solid fa-file-pdf" style={{ color: 'var(--cyan)' }} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
        Showing {filtered.length} of {entries.length} scans
      </p>
    </div>
  )
}
