import { motion } from 'framer-motion'

const LOGOS = [
  { name: 'Acme Corp', symbol: 'div', shape: 'rounded-full' },
  { name: 'GlobalLogistics', symbol: 'div', shape: 'rounded-tr-xl' },
  { name: 'NextGen', symbol: 'div', shape: 'rounded-sm rotate-45' },
  { name: 'StarkInd', symbol: 'div', shape: 'rounded-full' },
  { name: 'Initech', symbol: 'div', shape: 'rounded-tl-xl' },
  { name: 'Soylent', symbol: 'div', shape: 'rounded-sm rotate-12' },
]

export default function TrustSection() {
  return (
    <section className="py-16 border-y border-white/5 bg-black overflow-hidden relative">
      {/* Edge Fades */}
      <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10"></div>

      <div className="w-full px-8 lg:px-16 xl:px-24 mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Trusted by elite operations teams at</span>
      </div>
      
      <div className="flex w-full overflow-hidden">
        <motion.div 
          className="flex items-center gap-16 md:gap-24 whitespace-nowrap opacity-40 hover:opacity-100 transition-opacity duration-500"
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
        >
          {/* Double array for seamless loop */}
          {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
            <div key={idx} className="text-2xl font-black flex items-center gap-3 text-white">
              <div className={`w-6 h-6 bg-white ${logo.shape}`}></div>
              {logo.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
