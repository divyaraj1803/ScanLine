import { useState } from 'react'

const FAQS = [
  { q: 'How does ELA detection work?', a: 'Error Level Analysis re-compresses the image at a known JPEG quality and measures pixel-level differences. AI-generated images often show uniform error levels — real photos have varied, organic compression artifacts.' },
  { q: 'Can it detect all AI-generated images?', a: 'No forensic tool is 100% reliable. Modern generators (FLUX, Midjourney v6) produce images that pass many tests. Treat results as one signal alongside source, context, and reverse image search.' },
  { q: 'Is my image uploaded anywhere?', a: 'No. All analysis runs locally in your browser using the Canvas API and JavaScript. Nothing is transmitted to any server. The Gemini API call sends only the image bytes to Google — no metadata or identity.' },
  { q: 'What does the Gemini panel add?', a: 'After local heuristics run, Scanline sends the image to Gemini 1.5 Flash with a structured prompt asking it to assess AI generation likelihood. This is a second opinion — independent from ELA/FFT.' },
  { q: 'What is FFT Spectral Analysis?', a: 'The Fourier Transform reveals periodic noise patterns — AI upsampling pipelines introduce regular grid artifacts in frequency space that real camera sensors do not produce.' },
  { q: 'Why does EXIF data matter?', a: 'AI generators do not produce camera metadata (shutter speed, aperture, GPS, etc.). Missing or suspicious EXIF fields raise the synthetic risk score, though metadata can be stripped from authentic images too.' },
  { q: 'What is the PDF audit certificate?', a: 'A downloadable PDF containing the full scan report, heatmap visualizations, SHA-256 image hash, a UUID, and a timestamp. Useful as evidence for legal or HR processes.' },
  { q: 'How reliable is biometric mesh analysis?', a: 'The iris reflection model looks for specular highlights that are geometrically inconsistent — AI faces often have impossible or symmetric reflections. Accuracy is high for portrait-type images, lower for illustrations.' },
]

export default function About() {
  const [open, setOpen] = useState(null)
  const toggle = (i) => setOpen(o => o === i ? null : i)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
      <p className="mono-label" style={{ marginBottom: '0.5rem' }}>
        <i className="fa-solid fa-shield-halved" style={{ marginRight: '0.4rem' }} />
        STANDARDS & FAQ
      </p>
      <h1 className="heading-xl" style={{ marginBottom: '0.6rem' }}>
        Standards & <span className="accent">Frequently Asked Questions</span>
      </h1>
      <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
        The science behind deepfake detection, PDF verification, and Scanline's privacy principles.
      </p>

      <div className="disclaimer">
        <strong>Note:</strong> This is a heuristic tool, not a trained detection model. Treat results as one signal among several — not as proof.
      </div>

      {/* Science overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '🔬', title: 'Error Level Analysis', desc: 'Identifies JPEG re-compression inconsistencies that reveal edited or synthetic regions.' },
          { icon: '📊', title: 'Fourier Spectrum', desc: 'Surfaces periodic noise grids introduced by neural upsampling and rendering pipelines.' },
          { icon: '👁️', title: 'Biometric Mesh', desc: 'Checks geometric consistency of iris reflections and facial symmetry across landmark points.' },
          { icon: '📄', title: 'EXIF Validation', desc: 'Inspects camera metadata plausibility — AI generators produce no organic hardware metadata.' },
        ].map(c => (
          <div key={c.title} className="card">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{c.icon}</div>
            <h3 className="heading-sm" style={{ marginBottom: '0.35rem' }}>{c.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ accordion */}
      <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>Frequently Asked Questions</h2>
      {FAQS.map((item, i) => (
        <div key={i} className="faq-item">
          <div className="faq-q" onClick={() => toggle(i)}>
            <span>{item.q}</span>
            <i className={`fa-solid fa-chevron-down`} style={{ transition: 'transform 0.2s', transform: open === i ? 'rotate(180deg)' : 'rotate(0)', color: 'var(--text-dim)', fontSize: '0.8rem' }} />
          </div>
          {open === i && <div className="faq-a">{item.a}</div>}
        </div>
      ))}
    </div>
  )
}
