import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { BeakerIcon, XMarkIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'

function DemoBanner() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const handleExit = async () => {
    await logout()
    navigate('/')
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="flex-none"
        >
          <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 overflow-hidden">
            {/* Subtle animated gradient shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            />

            {/* Left: Icon + Text */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Badge */}
              <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <BeakerIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Demo Account</span>
              </div>

              {/* Message */}
              <p className="text-[11px] text-amber-300/70 font-medium hidden sm:block truncate">
                You're exploring a live demo. All data is simulated and read-only.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 rounded-lg transition-all duration-200 group"
              >
                <ArrowRightEndOnRectangleIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                Exit Demo
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                title="Dismiss"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DemoBanner
