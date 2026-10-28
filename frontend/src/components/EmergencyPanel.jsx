const RESOURCES = [
  { color: '#2563eb', category: 'UK · Police', name: 'National Police', hotline: '999', website: 'https://www.police.uk', note: 'Emergency. Non-emergency: 101' },
  { color: '#dc2626', category: 'UK · Charity', name: 'Refuge', hotline: '0808 2000 247', website: 'https://refuge.org.uk', note: '24/7. Free, confidential.' },
  { color: '#7c3aed', category: 'UK · Support', name: 'Revenge Porn Helpline', hotline: '0345 600 0459', website: 'https://revengepornhelpline.org.uk', note: 'Mon–Fri 10am–4pm.' },
  { color: '#065f46', category: 'UK · Mental Health', name: 'Samaritans', hotline: '116 123', website: 'https://samaritans.org', note: 'Free. 24/7. Confidential.' },
  { color: '#b45309', category: 'INT · Cyber', name: 'IC3 (FBI)', hotline: '—', website: 'https://ic3.gov', note: 'File a complaint online.' },
  { color: '#1e3a5f', category: 'UK · Digital', name: 'NCSC', hotline: '—', website: 'https://ncsc.gov.uk/report-an-incident', note: 'Report cybercrime online.' },
]

export default function EmergencyPanel() {
  return (
    <section className="emergency-panel" style={{ marginTop: '2.5rem' }}>
      <div className="emergency-header">
        <div className="emergency-icon-wrap">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <div>
          <div className="emergency-label-top">Alert · AI Content Detected</div>
          <h2 className="emergency-title">If this image was used to harm someone</h2>
          <p className="emergency-sub">AI-generated deepfake imagery can cause serious harm. Contact resources below — your identity is protected.</p>
        </div>
      </div>

      <div className="emergency-grid">
        {RESOURCES.map(r => (
          <div key={r.name} className="emergency-card" style={{ borderTopColor: r.color }}>
            <div className="emergency-category">{r.category}</div>
            <div className="emergency-name">{r.name}</div>
            {r.hotline !== '—' && (
              <a href={`tel:${r.hotline}`} className="emergency-hotline">{r.hotline}</a>
            )}
            <a href={r.website} target="_blank" rel="noopener noreferrer" className="emergency-link">
              <i className="fa-solid fa-arrow-up-right-from-square" /> {r.website.replace('https://', '')}
            </a>
            <div className="emergency-note">{r.note}</div>
          </div>
        ))}
      </div>

      <div className="emergency-footer">
        <i className="fa-solid fa-circle-info" style={{ color: 'var(--navy)', marginRight: '0.4rem' }} />
        Shown automatically when Scanline detects AI-generated imagery. All linked resources are official government or registered-NGO services.
      </div>
    </section>
  )
}
