import { 
  BoltIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  InboxStackIcon, 
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    title: 'Automation Engine',
    description: 'Trigger workflows based on contacts, bookings, or inventory changes. No code required.',
    icon: BoltIcon,
    colSpan: 'md:col-span-2 lg:col-span-2',
    bgClasses: 'bg-gradient-to-br from-indigo-900/20 to-black',
  },
  {
    title: 'Team Permissions',
    description: 'Granular RBAC (Role-Based Access Control) to keep your data secure.',
    icon: UserGroupIcon,
    colSpan: 'md:col-span-1 lg:col-span-1',
    bgClasses: 'bg-black',
  },
  {
    title: 'BI Dashboard',
    description: 'Real-time financial insights, booking trends, and operational health metrics.',
    icon: ChartBarIcon,
    colSpan: 'md:col-span-1 lg:col-span-1',
    bgClasses: 'bg-black',
  },
  {
    title: 'Unified Inbox',
    description: 'Manage customer communications from email, chat, and forms in one place.',
    icon: InboxStackIcon,
    colSpan: 'md:col-span-2 lg:col-span-2',
    bgClasses: 'bg-gradient-to-bl from-purple-900/20 to-black',
  },
  {
    title: 'Inventory Tracking',
    description: 'Low-stock alerts and automatic reordering suggestions to prevent stockouts before they happen.',
    icon: ClipboardDocumentCheckIcon,
    colSpan: 'md:col-span-2 lg:col-span-2',
    bgClasses: 'bg-gradient-to-tr from-blue-900/10 to-black',
  },
  {
    title: 'Enterprise Security',
    description: 'Audit logs, secure auth, and encryption standard on all plans.',
    icon: ShieldCheckIcon,
    colSpan: 'md:col-span-1 lg:col-span-1',
    bgClasses: 'bg-black',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export default function Features() {
  return (
    <section id="features" className="py-32 bg-black relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full px-8 lg:px-16 xl:px-24 relative z-10">
        
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Everything you need to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">run operations</span>
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto font-medium">
            Replace your patchwork of spreadsheets and disconnected tools with one cohesive, lightning-fast operating system.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {FEATURES.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className={`group relative p-8 rounded-3xl border border-white/10 overflow-hidden ${feature.colSpan} ${feature.bgClasses} transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(79,70,229,0.15)]`}
            >
              {/* Radial Hover Glow */}
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl bg-[radial-gradient(400px_circle_at_var(--x,50%)_var(--y,50%),rgba(99,102,241,0.15),transparent)] z-0 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all duration-500 shadow-inner">
                  <feature.icon className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-indigo-100 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-white/50 text-lg leading-relaxed font-medium group-hover:text-white/70 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
