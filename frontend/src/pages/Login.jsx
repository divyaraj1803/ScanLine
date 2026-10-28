import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const API_BASE = 'http://localhost:5000'

export default function Login() {
  const [tab, setTab]         = useState('login')
  const [username, setU]      = useState('')
  const [password, setP]      = useState('')
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body     = tab === 'login' ? { username, password } : { username, password, email }
    try {
      const resp = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await resp.json()
      if (!resp.ok) { setError(data.error || 'Something went wrong.'); return }
      if (tab === 'register') {
        setSuccess('Account created! Signing you in...')
        await new Promise(r => setTimeout(r, 800))
      }
      login({ username: data.username, email: data.email }, data.token)
      navigate('/')
    } catch {
      setError('Connection failed. Check that the backend is running on port 5000.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: 2, marginBottom: '0.2rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle', boxShadow: '0 0 8px var(--cyan)' }} />
            SCANLINE
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: 1 }}>IMAGE FORENSICS ENGINE</p>
        </div>

        <div className="auth-tabs">
          {['login', 'register'].map(t => (
            <button key={t} className={`auth-tab${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); setError(''); setSuccess('') }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error   && <div className="auth-error"><i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.4rem' }} />{error}</div>}
        {success && <div className="auth-success"><i className="fa-solid fa-circle-check" style={{ marginRight: '0.4rem' }} />{success}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" required minLength={3} autoComplete="username"
              value={username} onChange={e => setU(e.target.value)} placeholder="Enter username" />
          </div>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Email <span style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
              <input className="form-input" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required minLength={6} autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setP(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.4rem' }} />Working...</>
              : tab === 'login' ? 'Sign In → ' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.1rem', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', color: 'var(--text-dim)' }}>
          {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.70rem', textDecoration: 'underline' }}>
            {tab === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
