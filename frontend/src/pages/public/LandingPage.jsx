import Navbar from '../../components/landing/Navbar'
import Hero from '../../components/landing/Hero'
import TrustSection from '../../components/landing/TrustSection'
import Features from '../../components/landing/Features'
import Pricing from '../../components/landing/Pricing'
import Footer from '../../components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
