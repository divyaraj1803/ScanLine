import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home    from './pages/Home'
import About   from './pages/About'
import Models  from './pages/Models'
import Batch   from './pages/Batch'
import History from './pages/History'
import Login   from './pages/Login'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
        <Navbar />
        <main className="page-main">
          <div className="container">
            <Routes>
              <Route path="/"        element={<Home />} />
              <Route path="/about"   element={<About />} />
              <Route path="/models"  element={<Models />} />
              <Route path="/batch"   element={<Batch />} />
              <Route path="/history" element={<History />} />
              <Route path="/login"   element={<Login />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  </AuthProvider>
  )
}
