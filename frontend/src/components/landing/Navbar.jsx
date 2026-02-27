import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { demoLogin } = useAuth()
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    try {
      const result = await demoLogin()
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Demo login failed', err)
    } finally {
      setDemoLoading(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed w-full z-50 top-0 left-0 transition-all duration-500 border-b ${
      scrolled 
        ? 'bg-black/60 backdrop-blur-xl border-white/10 py-3' 
        : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="w-full px-8 lg:px-16 xl:px-24 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(79,70,229,0.7)] transition-all duration-300">
            ⚡
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CoreWebOps
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Pricing</a>
          <div className="h-4 w-px bg-white/10"></div>
          <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Log In
          </Link>
          <button 
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
          >
            {demoLoading ? <span className="spinner" style={{width: 14, height: 14, borderWidth: 2}} /> : 'Live Demo'}
          </button>
          <Link 
            to="/register" 
            className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white/70 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
