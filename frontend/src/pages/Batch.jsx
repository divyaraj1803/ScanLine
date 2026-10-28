import { useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

const API_USES = [
  { num: '01', color: '#38bdf8', title: 'Single Image Forensic Scan',    endpoint: 'POST /api/analyze',    desc: 'Submit any JPG, PNG, or WEBP image and receive a full forensic verdict — ELA score, FFT noise, facial symmetry — within 200ms.' },
  { num: '02', color: '#2dd4bf', title: 'PDF Forensic Report Generation', endpoint: 'analyze + jsPDF',       desc: 'Generate a signed PDF audit certificate client-side with SHA-256 hash, UUID, and ELA heatmap via jsPDF.' },
  { num: '03', color: '#fbbf24', title: 'Batch Queue Processing',         endpoint: 'POST /api/batch',       desc: 'Send up to 20 images per request. Results are returned as a JSON array, sorted by synthetic probability score.' },
  { num: '04', color: '#818cf8', title: 'Webhook Alerts on Detection',    endpoint: 'webhook_url param',     desc: 'Register a webhook_url in settings. Scanline POSTs an alert payload whenever a synthetic image exceeds your threshold.' },
  { num: '05', color: '#f87171', title: 'Audit History Export',           endpoint: 'GET /api/history',      desc: 'Pull full scan history with timestamps, verdicts, confidence scores, and links to PDF reports for compliance audits.' },
  { num: '06', color: '#34d399', title: 'Model Benchmark & Metadata',     endpoint: 'GET /api/models',       desc: 'Retrieve accuracy benchmarks, latency figures, and supported generator fingerprints (Midjourney, FLUX, SDXL, DALL·E 3).' },
]

export default function Batch() {
  const [files,    setFiles]   = useState([])
  const [results,  setResults] = useState([])
  const [loading,  setLoading] = useState(false)
  const [apiInput, setApiInput]= useState('POST /api/analyze')
  const [apiResp,  setApiResp] = useState(null)
  const fileRef = useRef(null)

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/')).slice(0, 20)
    setFiles(prev => [...prev, ...arr].slice(0, 20))
  }

  const runBatch = async () => {
    if (!files.length) return
    setLoading(true); setResults([])
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('images', f))
      const { data } = await axios.post(`${API_BASE}/api/batch`, fd)
      setResults(data.results || [])
    } catch (err) {
      alert('Batch failed: ' + (err.response?.data?.error || err.message))
    } finally { setLoading(false) }
  }

  const sendApiTest = async () => {
    const trimmed = apiInput.trim()
    let url = `${API_BASE}`
    let method = 'GET'
    if (trimmed.startsWith('POST')) { method = 'POST'; url += trimmed.replace('POST', '').trim() }
    else url += trimmed.replace('GET', '').trim()
    try {
      const resp   = method === 'GET' ? await axios.get(url) : await axios.post(url, {})
      setApiResp({ ok: true, data: resp.data })
    } catch (err) {
      setApiResp({ ok: false, data: err.response?.data || { error: err.message } })
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
      <p className="mono-label" style={{ marginBottom: '0.5rem' }}>
        <i className="fa-solid fa-layer-group" style={{ marginRight: '0.4rem' }} />
        BATCH QUEUE & API SANDBOX
      </p>
      <h1 className="heading-xl" style={{ marginBottom: '0.6rem' }}>Batch & API</h1>
      <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
        Process multiple images at once and explore the Scanline REST API directly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Batch upload */}
        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: '0.85rem' }}>
            <i className="fa-solid fa-upload" style={{ marginRight: '0.45rem', color: 'var(--navy)' }} />
            Batch Image Queue
          </h2>
          <div
            style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r-sm)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '0.85rem', transition: 'all 0.18s' }}
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            onDragOver={e => e.preventDefault()}
          >
            <input type="file" ref={fileRef} style={{ display: 'none' }} multiple accept="image/*" onChange={e => addFiles(e.target.files)} />
            <i className="fa-solid fa-images" style={{ fontSize: '1.6rem', color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Drop images or click — max 20
            </p>
          </div>

          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', borderRadius: 'var(--r-sm)', padding: '0.45rem 0.75rem', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{f.name}</span>
              <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={runBatch} disabled={loading || !files.length}>
            {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Processing...</> : <><i className="fa-solid fa-play" /> Run Batch ({files.length})</>}
          </button>

          {results.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p className="mono-label" style={{ marginBottom: '0.5rem' }}>Results</p>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontFamily: 'var(--font-mono)' }}>{r.fileName}</span>
                  <span className={`badge ${r.isDeepfake ? 'badge-fake' : 'badge-real'}`}>{r.confidenceScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API sandbox */}
        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: '0.85rem' }}>
            <i className="fa-solid fa-terminal" style={{ marginRight: '0.45rem', color: 'var(--navy)' }} />
            API Sandbox
          </h2>
          <div className="form-group">
            <label className="form-label">Endpoint</label>
            <select className="form-select" value={apiInput} onChange={e => setApiInput(e.target.value)} style={{ width: '100%' }}>
              <option>GET /api/health</option>
              <option>GET /api/models</option>
              <option>GET /api/history</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={sendApiTest}>
            <i className="fa-solid fa-paper-plane" /> Send Request
          </button>
          {apiResp && (
            <pre style={{ marginTop: '0.85rem', background: 'var(--bg-raised)', color: '#38bdf8', padding: '0.85rem', borderRadius: 'var(--r-sm)', fontSize: '0.70rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)' }}>
              {JSON.stringify(apiResp.data, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* 6 API Uses */}
      <div>
        <h2 className="heading-lg" style={{ marginBottom: '0.35rem' }}>Six Ways to Use the Scanline API</h2>
        <p className="subtitle" style={{ marginBottom: '1.25rem' }}>
          Your <code style={{ background: 'rgba(15,23,42,0.06)', padding: '0.1rem 0.35rem', borderRadius: 3, fontSize: '0.78rem' }}>sl_live_*</code> key authenticates every request to the Scanline REST API.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {API_USES.map(u => (
            <div key={u.num} className="card" style={{ borderLeft: `3px solid ${u.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
                <span style={{ background: u.color, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.64rem', padding: '0.1rem 0.4rem', borderRadius: 3 }}>{u.num}</span>
                <h3 className="heading-sm">{u.title}</h3>
              </div>
              <code style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: u.color, background: 'rgba(15,23,42,0.04)', padding: '0.2rem 0.5rem', borderRadius: 3, marginBottom: '0.6rem' }}>
                {u.endpoint}
              </code>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{u.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(15,23,42,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--text-dim)' }}>
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--navy)', marginRight: '0.4rem' }} />
          All API requests require <code>Authorization: Bearer &lt;your_key&gt;</code>. Rate limit: 500 requests/day on free tier.
        </div>
      </div>
    </div>
  )
}
