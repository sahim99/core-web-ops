import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

const DURATION = 0.8
const STAGGER = 0.15

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: [0.16, 1, 0.3, 1] } }
}

export default function Hero() {
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

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-10 lg:pt-24 lg:pb-12 overflow-hidden">
      
      {/* Deep Space Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{animationDuration: '6s'}}></div>
        <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{animationDuration: '8s', animationDelay: '1s'}}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="w-full px-8 lg:px-16 xl:px-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
          
          {/* Text Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-indigo-300 text-xs font-bold tracking-wide mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(79,70,229,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
              </span>
              PUBLIC BETA IS LIVE
            </motion.div>
            
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.2rem] font-black tracking-tighter text-white mb-4 leading-[1.05]"
            >
              Operational <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x bg-[length:200%_auto]">
                Command Center
              </span> <br className="hidden lg:block" />
              for Growing Teams
            </motion.h1>
            
            <motion.p 
              variants={itemVariants} 
              className="text-base text-white/50 mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Manage contacts, bookings, automation, and inventory — from one structured workspace. Stop stitching together 5 different tools.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
              >
                Start for free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <button 
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm rounded-xl font-semibold transition-all backdrop-blur-md flex items-center justify-center gap-2"
              >
                {demoLoading ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <>
                     <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                     Live Demo
                  </>
                )}
              </button>
            </motion.div>
            <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center lg:justify-start gap-6 text-white/40 text-xs font-semibold tracking-wide">
               <div className="flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                 NO CREDIT CARD
               </div>
               <div className="flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                 14-DAY TRIAL
               </div>
            </motion.div>
          </motion.div>

          {/* Glowing Isometric Mockup */}
          <motion.div 
            className="flex-1 w-full max-w-[600px] lg:max-w-none relative perspective-1000"
            initial={{ opacity: 0, y: 50, rotateX: 10, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
             <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 bg-[length:200%_auto] animate-gradient-x"></div>
                
                <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden aspect-[16/10] flex flex-col">
                   {/* Fake Browser Header */}
                   <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                      <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-white/20"></div>
                         <div className="w-3 h-3 rounded-full bg-white/20"></div>
                         <div className="w-3 h-3 rounded-full bg-white/20"></div>
                      </div>
                      <div className="ml-4 flex-1 max-w-sm h-5 bg-white/5 rounded-md border border-white/5"></div>
                   </div>
                   
                   {/* Fake App Layout */}
                   <div className="flex-1 flex overflow-hidden">
                      {/* Fake Sidebar */}
                      <div className="w-48 border-r border-white/5 p-4 space-y-4 hidden sm:block bg-white/[0.01]">
                         <div className="h-5 w-24 bg-white/10 rounded mb-8"></div>
                         <div className="h-4 w-full bg-white/5 rounded"></div>
                         <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                         <div className="h-4 w-4/5 bg-white/5 rounded"></div>
                         <div className="h-4 w-5/6 bg-indigo-500/20 rounded border border-indigo-500/20"></div>
                         <div className="h-4 w-2/3 bg-white/5 rounded"></div>
                      </div>
                      
                      {/* Fake Content */}
                      <div className="flex-1 p-6 space-y-6">
                          <div className="flex justify-between items-center">
                             <div className="h-8 w-40 bg-white/10 rounded-lg"></div>
                             <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-full"></div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                             <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(79,70,229,0.1)] p-4 flex flex-col justify-end">
                                <div className="h-6 w-1/2 bg-indigo-400/40 rounded"></div>
                             </div>
                             <div className="h-28 rounded-xl bg-white/[0.03] border border-white/5 p-4 flex flex-col justify-end">
                                <div className="h-6 w-2/3 bg-white/20 rounded"></div>
                             </div>
                             <div className="h-28 rounded-xl bg-white/[0.03] border border-white/5 p-4 flex flex-col justify-end">
                                <div className="h-6 w-1/2 bg-white/20 rounded"></div>
                             </div>
                          </div>
                          
                          <div className="h-40 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                             {/* Fake Chart Line */}
                             <div className="absolute bottom-0 left-0 w-full h-2/3 flex items-end px-6 gap-2">
                                {[30, 45, 25, 60, 40, 75, 50, 90, 65, 100].map((h, i) => (
                                  <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500/40 to-indigo-400/10 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                             </div>
                          </div>
                      </div>
                   </div>
                   
                   {/* Overlay Badge */}
                   <motion.div 
                     className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 1.5, duration: 0.5 }}
                   >
                       <div className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase">System Status</div>
                          <div className="text-sm font-bold text-white">All Systems Operational</div>
                       </div>
                   </motion.div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom fade for transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10"></div>
    </section>
  )
}
