import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const [mode, setMode] = useState('owner-login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    staff_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginAsStaff } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'staff-login') {
        const result = await loginAsStaff(form.staff_id, form.email, form.password)
        if (result.success) {
          navigate('/dashboard')
        } else {
          setError(result.error)
        }
      } else {
        const result = await login(form.email, form.password)
        if (result.success) {
          navigate('/dashboard')
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isStaffLogin = mode === 'staff-login'

  return (
    <div className="min-h-screen flex bg-black overflow-hidden font-sans">
      
      {/* LEFT SIDE - VISUAL/TESTIMONIAL PANEL */}
      <div className="hidden lg:flex w-1/2 relative bg-[var(--bg-primary)] items-center justify-center p-12 lg:p-24 border-r border-white/5 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgyMHYyMEgxVjF6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-30 select-none pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-300 tracking-wider">VERSION 2.0 LIVE</span>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 leading-[1.15] tracking-tight">
            The operating system for modern business.
          </h2>
          
          <p className="text-lg xl:text-xl text-white/50 mb-12 font-medium leading-relaxed">
            Replace your patchwork of spreadsheets and disconnected tools with one cohesive, lightning-fast platform.
          </p>

          <div className="border border-white/10 p-6 rounded-2xl bg-white/[0.02] backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500 hover:bg-white/[0.04]">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
             <p className="text-base text-white/70 italic mb-6">
               "CoreWebOps has drastically reduced our operational overhead. The automation engine is simply incredible."
             </p>
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                  SM
               </div>
               <div>
                 <div className="text-sm font-bold text-white">Sarah Miller</div>
                 <div className="text-xs text-white/40">VP of Operations, NextGen</div>
               </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-black">
        {/* Subtle mobile background */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
           <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12 lg:mb-16 group w-fit">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all duration-300">
              ⚡
            </div>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-100 transition-colors">
              CoreWebOps
            </span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-white/50 mb-8 font-medium">Please enter your details to sign in.</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-xl mb-8">
            <button
               type="button"
               onClick={() => switchMode('owner-login')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isStaffLogin ? 'bg-indigo-600 outline outline-1 outline-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              Workspace Owner
            </button>
            <button
               type="button"
               onClick={() => switchMode('staff-login')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${isStaffLogin ? 'bg-indigo-600 outline outline-1 outline-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              Staff Member
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isStaffLogin && (
                <motion.div
                  key="staff-field"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-bold text-white/80 mb-1.5 uppercase tracking-wider text-[11px]">Staff ID</label>
                  <input
                    type="text"
                    name="staff_id"
                    placeholder="e.g. ABCD12345K"
                    value={form.staff_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-1.5 uppercase tracking-wider text-[11px]">Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                 <label className="block text-sm font-bold text-white/80 uppercase tracking-wider text-[11px]">Password</label>
                 <a href="#" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-lg text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold transition-all duration-300 bg-white text-black hover:bg-white/90 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] text-base tracking-wide flex items-center justify-center mt-2 group"
            >
              {loading ? (
                <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2, borderColor: 'black', borderTopColor: 'transparent' }} />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </span>
              )}
            </button>

          </form>

          <div className="mt-8 text-center">
            <span className="text-white/40 text-sm font-medium">Don't have a workspace? </span>
            <Link to="/register" className="text-white font-bold hover:text-indigo-300 transition-colors text-sm">
              Create one
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
