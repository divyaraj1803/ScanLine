import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const KEY = 'scanline_auth'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null)
        } catch {
          setUser(null)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = useCallback((userData, token) => {
    const u = { ...userData, token }
    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
