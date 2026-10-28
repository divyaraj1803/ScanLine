import { useState, useRef, useCallback } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js'
import { useScanEngine } from '../hooks/useScanEngine'
import EmergencyPanel from '../components/EmergencyPanel'
import { generatePDFReport } from '../utils/pdfExport'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

/* ── Gauge SVG ── */
function GaugeSVG({ score, isFake }) {
  const pct = Math.max(0, Math.min(1, (score || 0) / 100))
  const r   = 78
  const cx  = 100, cy = 100
  const rad = a => (a * Math.PI) / 180
  // Arc sweeps from -180deg to 0deg (left to right)
  const endAngle = -180 + pct * 180
  const x = cx + r * Math.cos(rad(endAngle))
  const y = cy + r * Math.sin(rad(endAngle))
  const clr = isFake ? '#f87171' : '#34d399'
  const trackClr = 'rgba(148,163,184,0.10)'

  return (
    <svg viewBox="0 0 200 108" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      {/* Track */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={trackClr} strokeWidth="13" strokeLinecap="round" />
      {/* Fill */}
      {pct > 0 && (
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
          fill="none" stroke={clr} strokeWidth="13" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${clr}66)` }}
        />
      )}
      {/* Needle dot */}
      <circle cx={x} cy={y} r="5.5" fill={clr} style={{ filter: `drop-shadow(0 0 4px ${clr})` }} />
      {/* Score text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="24" fontWeight="800"
        fontFamily="DM Mono, monospace" fill={clr}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7.5" fontFamily="DM Mono, monospace"
        fill="#475569" letterSpacing="1.5">{isFake ? 'SYNTHETIC RISK' : 'AUTHENTIC'}</text>
    </svg>
  )
}

export default function Home() {
  const { state, step, scan, error, STEPS, runScan, reset } = useScanEngine()
  const [dragOver, setDragOver] = useState(false)
  const [heatMode, setHeatMode] = useState('original')
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please upload an image file (JPG, PNG, WEBP).'); return }
    setHeatMode('original')   // always reset to original view
    runScan(file)
  }, [runScan])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const isFake  = scan?.isDeepfake
  const score   = scan?.confidenceScore
  const metrics = scan?.metrics

  const radarData = metrics ? {
    labels: ['ELA', 'Noise', 'Entropy', 'EXIF', 'Texture'],
    datasets: [{
      label: 'Signal Strength',
      data: [
        metrics.elaDiscrepancy,
        metrics.spectralNoise,
        metrics.facialSymmetry,
        metrics.exifIntegrity,
        Math.round((metrics.spectralNoise + metrics.elaDiscrepancy) / 2)
      ],
      backgroundColor: isFake ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
      borderColor:     isFake ? '#f87171' : '#34d399',
      borderWidth: 1.5,
      pointBackgroundColor: isFake ? '#f87171' : '#34d399',
      pointRadius: 3,
    }]
  } : null

  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(148,163,184,0.08)' },
        angleLines: { color: 'rgba(148,163,184,0.09)' },
        pointLabels: { color: '#475569', font: { family: 'DM Mono', size: 10 } }
      }
    },
    plugins: { legend: { display: false } }
  }

  const displaySrc = heatMode === 'ela' ? scan?.elaHeatmapUri : scan?.sourceImageUri

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 0 4rem' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '1rem 0 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem' }}>
        <p className="mono-label" style={{ marginBottom: '0.5rem' }}>
          <i className="fa-solid fa-radar" style={{ marginRight: '0.4rem', color: 'var(--cyan)' }} />
          SCANLINE — AI IMAGE FORENSICS ENGINE
        </p>
        <h1 className="heading-xl">
          Is this image <span className="accent">real or AI-generated?</span>
        </h1>
        <p className="subtitle" style={{ marginTop: '0.6rem', maxWidth: 620 }}>
          Upload any image. Scanline uses Gemini 1.5 Flash vision AI + local forensic analysis to determine if it was created by an AI generator or a real camera.
        </p>
        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <strong>Primary detector:</strong> Google Gemini 1.5 Flash Vision — the most accurate signal. ELA heatmap and noise metrics are supplementary.
        </div>
      </section>

      {/* ── Upload Zone ── */}
      {state === 'idle' && (
        <div
          className={`dropzone${dragOver ? ' dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            type="file" ref={fileInputRef} style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = '' }}
          />
          <div className="dropzone-bracket">[ + ]</div>
          <h2 className="dropzone-title">Drop an image here, or click to browse</h2>
          <p className="dropzone-sub">JPG · PNG · WEBP · AVIF — processed locally & via Gemini API</p>
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {['AI Portrait', 'AI Art', 'Real Photo', 'Document'].map(label => (
              <span key={label} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-dim)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.2rem 0.55rem'
              }}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Scanning ── */}
      {state === 'scanning' && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div className="scan-spinner-wrap" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <div className="scan-spinner" />
          </div>
          <h3 className="heading-sm" style={{ marginBottom: '0.3rem' }}>
            {STEPS[step] || 'Processing...'}
          </h3>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', marginBottom: '1.25rem' }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <ul className="step-list">
            {STEPS.map((s, i) => (
              <li key={i} className={`step-item${i < step ? ' done' : i === step ? ' active' : ''}`}>
                <i className={`fa-solid ${i < step ? 'fa-circle-check' : i === step ? 'fa-circle-dot' : 'fa-circle'}`}
                  style={{ fontSize: '0.70rem', flexShrink: 0 }} />
                {s}
              </li>
            ))}
          </ul>
          {step >= 3 && (
            <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--cyan)' }}>
              <i className="fa-brands fa-google" style={{ marginRight: '0.4rem' }} />
              Waiting for Gemini response...
            </p>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {state === 'error' && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid var(--fake-red-border)' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: 'var(--fake-red)', display: 'block', marginBottom: '0.75rem' }} />
          <h3 className="heading-sm" style={{ color: 'var(--fake-red)', marginBottom: '0.5rem' }}>Scan Failed</h3>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '1.25rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={reset}>
            <i className="fa-solid fa-rotate" /> Try Again
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {state === 'done' && scan && (
        <div className="fade-up">

          {/* ─── Verdict Banner ─────────────────────────────────────────── */}
          <div style={{
            background: isFake
              ? 'linear-gradient(135deg, rgba(185,28,28,0.12) 0%, rgba(248,113,113,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(6,95,70,0.12) 0%, rgba(52,211,153,0.06) 100%)',
            border: `1px solid ${isFake ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'}`,
            borderRadius: 'var(--r-md)', padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              {/* Primary verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <i className={`fa-solid ${isFake ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}
                  style={{ color: isFake ? 'var(--fake-red)' : 'var(--real-green)', fontSize: '1.1rem' }} />
                <h2 className="heading-lg" style={{ color: isFake ? 'var(--fake-red)' : 'var(--real-green)' }}>
                  {isFake ? 'AI-GENERATED IMAGE DETECTED' : 'AUTHENTIC PHOTOGRAPH'}
                </h2>
                <span className={`badge ${isFake ? 'badge-fake' : 'badge-real'}`}>
                  {score}% {isFake ? 'synthetic' : 'authentic'}
                </span>
              </div>

              {/* Gemini reasoning */}
              {scan.geminiReasoning && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.6, maxWidth: 580 }}>
                  <i className="fa-brands fa-google" style={{ color: 'var(--cyan)', marginRight: '0.4rem', fontSize: '0.78rem' }} />
                  {scan.geminiReasoning}
                </p>
              )}

              {/* Generator chip */}
              {isFake && scan.geminiGenerator && scan.geminiGenerator !== 'Unknown' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-fake" style={{ fontSize: '0.62rem' }}>
                    <i className="fa-solid fa-robot" /> {scan.geminiGenerator}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <button className="btn btn-primary btn-sm" onClick={() => generatePDFReport(scan)}>
                <i className="fa-solid fa-file-pdf" /> Export PDF Report
              </button>
              <button className="btn btn-secondary btn-sm" onClick={reset}>
                <i className="fa-solid fa-rotate" /> New Scan
              </button>
            </div>
          </div>

          {/* Gemini attribution chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.18rem 0.55rem', background: 'rgba(56,189,248,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)' }}>
              <i className="fa-brands fa-google" style={{ color: 'var(--cyan)' }} />
              Gemini Vision AI — primary verdict
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.18rem 0.55rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)' }}>
              <i className="fa-solid fa-microchip" /> ELA + Noise — supplementary
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
              {scan.fileName} · {scan.fileSize} · {scan.dimensions}
            </span>
          </div>

          {/* ─── 2-col Grid ─────────────────────────────────────────────── */}
          <div className="detector-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem' }}>

            {/* Left: Image Viewer */}
            <div className="card" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <i className="fa-solid fa-image" style={{ marginRight: '0.4rem', color: 'var(--cyan)' }} />
                  IMAGE VIEWER
                </span>
              </div>

              {/* View toggle */}
              <div className="tab-bar">
                <button className={`tab-btn${heatMode === 'original' ? ' active' : ''}`} onClick={() => setHeatMode('original')}>
                  <i className="fa-solid fa-image" style={{ marginRight: '0.3rem' }} />Original
                </button>
                {scan.elaHeatmapUri && (
                  <button className={`tab-btn${heatMode === 'ela' ? ' active' : ''}`} onClick={() => setHeatMode('ela')}>
                    <i className="fa-solid fa-fire" style={{ marginRight: '0.3rem' }} />ELA Heatmap
                  </button>
                )}
              </div>

              {/* Image display */}
              <div className="canvas-frame" style={{ position: 'relative' }}>
                {displaySrc ? (
                  <img
                    src={displaySrc}
                    alt={heatMode === 'ela' ? 'ELA heatmap' : 'Uploaded image'}
                    style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                    No image
                  </span>
                )}
              </div>

              {heatMode === 'ela' && (
                <p style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: '0.3rem', color: 'var(--cyan)' }} />
                  ELA heatmap: <span style={{ color: '#38bdf8' }}>blue</span> = low compression error (suspicious uniformity),&nbsp;
                  <span style={{ color: '#f87171' }}>red</span> = high error (organic variation).
                </p>
              )}
            </div>

            {/* Right: Gauge + Metrics + Radar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Gauge */}
              <div className="card" style={{ textAlign: 'center', padding: '1.1rem' }}>
                <p className="mono-label" style={{ marginBottom: '0.6rem' }}>
                  <i className="fa-solid fa-gauge-high" style={{ marginRight: '0.3rem' }} />
                  CONFIDENCE SCORE
                </p>
                <GaugeSVG score={score} isFake={isFake} />
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={`badge ${isFake ? 'badge-fake' : 'badge-real'}`}>
                    <i className={`fa-solid ${isFake ? 'fa-robot' : 'fa-camera'}`} />
                    {isFake ? 'AI GENERATED' : 'AUTHENTIC'}
                  </span>
                </div>
              </div>

              {/* Supplementary metrics */}
              <div className="card" style={{ padding: '1.1rem' }}>
                <p className="mono-label" style={{ marginBottom: '0.65rem' }}>
                  <i className="fa-solid fa-table-list" style={{ marginRight: '0.35rem' }} />
                  FORENSIC SIGNALS
                </p>
                {[
                  ['fa-compress-arrows-alt', 'cyan',       'ELA Variance',  metrics?.elaDiscrepancy,  'Higher = more inconsistency (organic)'],
                  ['fa-wave-square',         'teal',       'Noise Level',   metrics?.spectralNoise,   'Higher = more natural sensor noise'],
                  ['fa-chart-simple',        'amber',      'Entropy',       metrics?.facialSymmetry,  'Pixel distribution uniformity'],
                  ['fa-file-code',           'real-green', 'EXIF Signal',   metrics?.exifIntegrity,   'Camera metadata presence'],
                ].map(([icon, clr, label, val, hint]) => (
                  <div key={label} className="metric-row" title={hint}>
                    <span className="metric-name">
                      <i className={`fa-solid ${icon}`} style={{ color: `var(--${clr})`, fontSize: '0.78rem' }} />
                      {label}
                    </span>
                    <span className="metric-val" style={{ color: 'var(--text-muted)' }}>{val}%</span>
                  </div>
                ))}
                <p style={{ marginTop: '0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  These are supplementary client-side signals. The verdict above is from Gemini AI.
                </p>
              </div>

              {/* Radar */}
              <div className="card" style={{ padding: '1.1rem' }}>
                <p className="mono-label" style={{ marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-chart-line" style={{ marginRight: '0.35rem' }} />
                  SIGNAL RADAR
                </p>
                <div style={{ height: 140 }}>
                  {radarData && <Radar data={radarData} options={radarOpts} />}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency resources (only if AI detected) */}
          {isFake && <EmergencyPanel />}

        </div>
      )}
    </div>
  )
}
