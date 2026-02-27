import { CheckIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

const BETA_PLAN = {
  name: 'Public Beta Access',
  price: '$0',
  period: '/forever during beta',
  description: 'Get full access to all features while we fine-tune the platform.',
  features: [
    'Unlimited Users', 
    'Unlimited Contacts', 
    'Advanced Automation Engine', 
    'Granular Team Permissions', 
    'Inventory Management',
    'API Access',
    'Priority Support',
    'Community Access'
  ],
  cta: 'Start Full Access Beta'
}

export default function Pricing() {
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
    <section id="pricing" className="py-32 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full px-8 lg:px-16 xl:px-24 relative z-10">
        
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide mb-6">
             <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
             LIMITED TIME OFFER
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Join the CoreWebOps Beta
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto font-medium">
            We are opening our doors to early adopters. Experience the full power of the platform for free in exchange for your feedback.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group p-8 md:p-10 rounded-3xl bg-white/[0.01] backdrop-blur-3xl border border-white/10 hover:border-indigo-500/50 transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.8)] hover:shadow-[0_0_80px_rgba(79,70,229,0.2)] relative overflow-hidden">
            
            {/* Animated Gradient Border Top */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="mb-10 relative">
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                {BETA_PLAN.name}
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tighter">
                  {BETA_PLAN.price}
                </span>
                <span className="text-white/40 font-medium tracking-wide">{BETA_PLAN.period}</span>
              </div>
              <p className="text-lg text-white/50 leading-relaxed font-medium">
                {BETA_PLAN.description}
              </p>
            </div>

            <div className="space-y-4 mb-10 relative">
              {BETA_PLAN.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center gap-4 text-base">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/40 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" strokeWidth={3} />
                  </div>
                  <span className="text-white/80 font-medium tracking-wide">{feat}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-5 rounded-2xl font-bold transition-all duration-300 bg-white text-black hover:bg-white/90 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] text-lg tracking-wide">
              {BETA_PLAN.cta}
            </button>
            <button 
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full mt-4 py-4 rounded-xl font-bold transition-all duration-300 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-base tracking-wide flex items-center justify-center gap-2"
            >
              {demoLoading ? <span className="spinner" style={{width: 16, height: 16, borderWidth: 2}} /> : 'Explore Live Demo'}
            </button>
            
            <p className="text-sm text-center text-white/40 mt-6 font-medium tracking-wide">
              No credit card required <span className="mx-2">•</span> Cancel anytime
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
