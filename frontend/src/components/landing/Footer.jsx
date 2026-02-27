export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Product: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
    Company:  ['About', 'Blog', 'Careers', 'Press', 'Contact'],
    Resources: ['Documentation', 'API Reference', 'Status', 'Community'],
    Legal:    ['Privacy', 'Terms', 'Security', 'Cookies'],
  }

  const socials = [
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.634 5.903-5.634Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ]

  return (
    <footer className="bg-black border-t border-white/[0.06] relative z-10">

      {/* Top CTA strip */}
      <div className="w-full px-8 lg:px-16 xl:px-24 py-16 border-b border-white/[0.06]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
              Ready to run your business<br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> from one place?</span>
            </h2>
            <p className="text-white/40 text-base font-medium max-w-xl">
              Join hundreds of growing teams already using CoreWebOps. No credit card required.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <a
              href="/register"
              className="px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm"
            >
              Get started free →
            </a>
            <a
              href="#"
              className="px-8 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm backdrop-blur-md"
            >
              View live demo
            </a>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="w-full px-8 lg:px-16 xl:px-24 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">

          {/* Brand col — spans 2 */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-7 w-7 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]">⚡</div>
              <span className="font-black text-white text-lg tracking-tight">CoreWebOps</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed font-medium mb-7 max-w-[240px]">
              The operating system for modern business. Built by engineers, for operators.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">{section}</h4>
              <ul className="space-y-3.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/45 hover:text-white transition-colors font-medium"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="w-full px-8 lg:px-16 xl:px-24 py-5 border-t border-white/[0.05]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-white/25 font-medium">
            <span>© {year} Core Web Ops Inc. All rights reserved.</span>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <span className="hidden sm:block">Made with ♥ for builders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-white/30 font-medium">All systems operational</span>
          </div>
        </div>
      </div>

    </footer>
  )
}
